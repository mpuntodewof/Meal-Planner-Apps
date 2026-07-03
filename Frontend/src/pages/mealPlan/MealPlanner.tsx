import React, { useState, useMemo } from 'react';
import { Button, ButtonGroup, Modal, Form } from 'react-bootstrap';
import { Navbar, Loader } from '../../components/sub-comp';
import Footer from '../../components/Footer';
import { format, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import salmon from '../../img/Food-bg.jpg';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store/storeRedux';
import userModel from '../../interfaces/userModel';
import { useGetMealPlansQuery, useCreateMealPlanMutation, useDeleteMealPlanMutation } from '../../api/mealPlanApi';
import { useGetRecipesQuery } from '../../api/recipeApi';
import toastNotify from '../../helper/toastNotify';
import withAuth from '../../HOC/withAuth';
import ShoppingList from './ShoppingList';

function MealPlanner() {
    const [currDate, setCurrDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showList, setShowList] = useState(false);

    const startCurrWeek = startOfWeek(currDate, { weekStartsOn: 0 });
    const endCurrWeek = endOfWeek(currDate, { weekStartsOn: 0 });
    const formattedRange = `${format(startCurrWeek, "MMMM d")} - ${format(endCurrWeek, "MMMM d, yyyy")}`;
    const rangeStart = format(startCurrWeek, "yyyy-MM-dd");
    const rangeEnd = format(endCurrWeek, "yyyy-MM-dd");

    const goToNextWeek = () => {
        const nextWeek = addDays(currDate, 7);
        setCurrDate(nextWeek);
        setSelectedDate(startOfWeek(nextWeek, { weekStartsOn: 0 }));
    }

    const goToPreviousWeek = () => {
        const prevWeek = subDays(currDate, 7);
        setCurrDate(prevWeek);
        setSelectedDate(startOfWeek(prevWeek, { weekStartsOn: 0 }));
    }

    const handleDateChange = (date: Date | null) => {
        if (date) {
            setCurrDate(date);
            setSelectedDate(date);
        }
    }

    const getDaysOfWeek = (start: Date): Date[] => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(addDays(start, i));
        }
        return days;
    };

    const daysOfWeek = getDaysOfWeek(startCurrWeek);

    // Redux Auth state
    const userData: userModel = useSelector(
        (state: RootState) => state.userAuthStore
    );
    const userId = userData.id;

    // API hooks
    const { data: mealPlansData, isLoading: isMealPlansLoading } = useGetMealPlansQuery(userId, { skip: !userId });
    const { data: recipesData } = useGetRecipesQuery(null);
    const [createMealPlan] = useCreateMealPlanMutation();
    const [deleteMealPlan] = useDeleteMealPlanMutation();

    // Client-side filtering & categorization.
    // The API returns a flat shape: each plan has a `dates` array (yyyy-MM-ddTHH:mm:ss)
    // plus flattened recipe fields (recipeName, imageUrl, ...).
    const activeDayPlans = useMemo(() => {
        if (!mealPlansData || !mealPlansData.result || !mealPlansData.result.$values) return [];
        const selectedStr = format(selectedDate, "yyyy-MM-dd");
        return mealPlansData.result.$values.filter((plan: any) => {
            const dates: string[] = plan.dates?.$values ?? plan.dates ?? [];
            return dates.some((d: string) => format(new Date(d), "yyyy-MM-dd") === selectedStr);
        });
    }, [mealPlansData, selectedDate]);

    const breakfastMeals = useMemo(() => activeDayPlans.filter((p: any) => p.mealType.toLowerCase() === "breakfast"), [activeDayPlans]);
    const lunchMeals = useMemo(() => activeDayPlans.filter((p: any) => p.mealType.toLowerCase() === "lunch"), [activeDayPlans]);
    const dinnerMeals = useMemo(() => activeDayPlans.filter((p: any) => p.mealType.toLowerCase() === "dinner"), [activeDayPlans]);

    // Accordion expand state
    const [openSection, setOpenSection] = useState<'breakfast' | 'lunch' | 'dinner' | null>('breakfast');

    // Add Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalMealType, setModalMealType] = useState("");
    const [selectedRecipeId, setSelectedRecipeId] = useState("");
    const [planName, setPlanName] = useState("");

    const handleOpenAddModal = (mealType: string) => {
        setModalMealType(mealType);
        setPlanName(`${mealType} Plan for ${format(selectedDate, "EEEE, MMMM d")}`);
        setSelectedRecipeId("");
        setShowAddModal(true);
    };

    const handleAddMeal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRecipeId) {
            toastNotify("Please select a recipe", "error");
            return;
        }

        // Block duplicates: same recipe already scheduled for this day + meal type.
        // activeDayPlans is already scoped to the selected day.
        const recipeIdNum = parseInt(selectedRecipeId);
        const alreadyScheduled = activeDayPlans.some(
            (p: any) => p.recipeId === recipeIdNum && p.mealType?.toLowerCase() === modalMealType.toLowerCase()
        );
        if (alreadyScheduled) {
            toastNotify(`This recipe is already in ${modalMealType} for the selected day.`, "error");
            return;
        }

        const planDateStr = format(selectedDate, "yyyy-MM-dd'T'00:00:00");
        const payload = {
            planName: planName,
            mealType: modalMealType,
            startDate: planDateStr,
            endDate: planDateStr,
            recipeId: parseInt(selectedRecipeId),
            userID: userId,
            mealPlanDaysDTO: [
                {
                    date: planDateStr
                }
            ]
        };

        try {
            await createMealPlan(payload).unwrap();
            toastNotify("Meal scheduled successfully", "success");
            setShowAddModal(false);
        } catch (err: any) {
            console.error("Error creating meal plan:", err);
            // 409 = the API rejected it as a duplicate (e.g. added from another tab).
            if (err?.status === 409) {
                toastNotify(`This recipe is already in ${modalMealType} for the selected day.`, "error");
            } else {
                toastNotify("Failed to schedule meal plan", "error");
            }
        }
    };

    const handleDeleteMeal = async (id: number) => {
        if (window.confirm("Are you sure you want to remove this meal from your planner?")) {
            try {
                await deleteMealPlan({ id, userId }).unwrap();
                toastNotify("Meal removed from planner", "success");
            } catch (err) {
                console.error("Error deleting meal plan:", err);
                toastNotify("Failed to remove meal from planner", "error");
            }
        }
    };

    const renderMealSection = (title: string, category: 'breakfast' | 'lunch' | 'dinner', meals: any[], iconClass: string) => {
        const isOpen = openSection === category;
        return (
            <div className="card single-accordion mb-3">
                <div 
                    className="card-header" 
                    onClick={() => setOpenSection(isOpen ? null : category)} 
                    style={{ cursor: 'pointer', backgroundColor: '#fcfcfc', borderBottom: '1px solid #eee' }}
                >
                    <h5 className="mb-0 d-flex justify-content-between align-items-center">
                        <button className="btn btn-link" type="button" style={{ textDecoration: 'none', color: '#051923', fontWeight: 'bold' }}>
                            <i className={`fa ${iconClass} mr-2`} style={{ color: '#F28123' }}></i> {title}
                        </button>
                        <i className={`fa ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ color: '#F28123' }}></i>
                    </h5>
                </div>
                <div className={`collapse ${isOpen ? 'show' : ''}`}>
                    <div className="card-body">
                        {meals.length === 0 ? (
                            <div className="text-center py-4 text-muted">
                                <p className="mb-3">No meals scheduled for {category}.</p>
                                <button className="boxed-btn" onClick={() => handleOpenAddModal(category.charAt(0).toUpperCase() + category.slice(1))}>
                                    <i className="fa fa-plus mr-2"></i> Add Meal
                                </button>
                            </div>
                        ) : (
                            <div className="meal-list">
                                {meals.map((plan: any) => {
                                    return (
                                        <div key={plan.id} className="d-flex align-items-center justify-content-between p-3 mb-3 border rounded shadow-sm bg-light">
                                            <div className="d-flex align-items-center">
                                                <img
                                                    src={plan.imageUrl || salmon}
                                                    alt={plan.recipeName}
                                                    className="rounded mr-3"
                                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                                />
                                                <div>
                                                    <h5 className="mb-1">
                                                        <a href={`/singleProduct/${plan.recipeId}`} className="text-dark font-weight-bold" style={{ textDecoration: 'none' }}>
                                                            {plan.recipeName}
                                                        </a>
                                                    </h5>
                                                    <p className="mb-1 text-muted small">
                                                        <i className="fa fa-clock-o mr-1"></i> {plan.cookingTime} | <i className="fa fa-users mr-1"></i> Servings: {plan.serviceSize}
                                                    </p>
                                                    <p className="mb-0 text-secondary font-italic small">
                                                        "{plan.planName}"
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="link" className="text-danger p-2" onClick={() => handleDeleteMeal(plan.id)}>
                                                <i className="fa fa-trash fa-lg"></i>
                                            </Button>
                                        </div>
                                    );
                                })}
                                <div className="text-right mt-3">
                                    <button className="boxed-btn" onClick={() => handleOpenAddModal(category.charAt(0).toUpperCase() + category.slice(1))}>
                                        <i className="fa fa-plus mr-2"></i> Add Another Meal
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <Navbar />

            <div className="breadcrumb-section" style={{ backgroundImage: `url(${salmon})` }}>
                <div className="container">
                    <div className="row">
                        <div className="col-lg-8 offset-lg-2 text-center">
                            <div className="breadcrumb-text">
                                <h1>Meal Planner</h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="single-product mt-100">
                <div className="container">
                    {/* Weekly Range button */}
                    <div className="row justify-content-center pb-4">
                        <div className="col-md-12 text-center">
                            <div className="product-filters d-inline-block">
                                <ButtonGroup className="date-navigator-pill cursor-pointer align-items-center">
                                    <Button variant="light" className="date-nav-button py-2 px-3" onClick={goToPreviousWeek}>
                                        <i className="fa fa-arrow-left"></i>
                                    </Button>

                                    <DatePicker
                                        selected={currDate}
                                        onChange={handleDateChange}
                                        customInput={
                                            <Button variant="outline-secondary" className="div-formatted-range px-4 py-2 font-weight-bold" style={{ borderColor: '#ddd', color: '#051923' }}>
                                                {formattedRange}
                                            </Button>
                                        }
                                        calendarStartDay={0}
                                    />

                                    <Button variant="light" className="date-nav-button py-2 px-3" onClick={goToNextWeek}>
                                        <i className="fa fa-arrow-right"></i>
                                    </Button>
                                </ButtonGroup>
                            </div>
                        </div>
                    </div>

                    {/* Days Row */}
                    <div className="row justify-content-center mb-5">
                        <div className="col-md-12">
                            <div className="product-filters text-center">
                                <ul style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', listStyle: 'none', padding: 0 }}>
                                    {daysOfWeek.map((day) => {
                                        const isSelected = format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                                        return (
                                            <button 
                                                key={day.toISOString()}
                                                className={`dates-button px-4 py-2 border rounded ${isSelected ? 'active' : ''}`}
                                                style={isSelected ? { backgroundColor: '#F28123', color: '#fff', borderColor: '#F28123' } : { backgroundColor: '#fff', color: '#051923', borderColor: '#ddd' }}
                                                onClick={() => setSelectedDate(day)}
                                            >
                                                <div style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.8 }}>{format(day, "EEE")}</div>
                                                <strong style={{ fontSize: '18px' }}>{format(day, "d")}</strong>
                                            </button>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Shopping List */}
                    <div className="row justify-content-center mb-4">
                        <div className="col-lg-8 col-md-10 text-center">
                            <Button
                                variant="outline-secondary"
                                style={{ borderColor: '#F28123', color: '#F28123' }}
                                onClick={() => setShowList((v) => !v)}
                            >
                                {showList ? "Hide shopping list" : "Generate shopping list"}
                            </Button>
                            {showList && (
                                <div className="mt-3 text-left">
                                    <ShoppingList userId={userId ?? ""} start={rangeStart} end={rangeEnd} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="single-product mt-10 mb-150">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-8 col-md-10">
                            {isMealPlansLoading ? (
                                <div className="text-center py-5">
                                    <Loader />
                                </div>
                            ) : (
                                <div className="checkout-accordion-wrap">
                                    <div className="accordion" id="accordionExample">
                                        {renderMealSection("Breakfast Meals", "breakfast", breakfastMeals, "fa-coffee")}
                                        {renderMealSection("Lunch Meals", "lunch", lunchMeals, "fa-cutlery")}
                                        {renderMealSection("Dinner Meals", "dinner", dinnerMeals, "fa-moon-o")}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Meal Plan Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Schedule {modalMealType}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddMeal}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label className="font-weight-bold">Selected Date</Form.Label>
                            <Form.Control 
                                type="text" 
                                value={format(selectedDate, "EEEE, MMMM d, yyyy")} 
                                disabled 
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="font-weight-bold">Meal Category</Form.Label>
                            <Form.Control 
                                type="text" 
                                value={modalMealType} 
                                disabled 
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="font-weight-bold">Select Recipe</Form.Label>
                            <Form.Select 
                                value={selectedRecipeId} 
                                onChange={(e) => setSelectedRecipeId(e.target.value)} 
                                required
                                className="form-control"
                            >
                                <option value="">-- Choose a Recipe --</option>
                                {recipesData?.result?.$values?.map((recipe: any) => (
                                    <option key={recipe.id} value={recipe.id}>
                                        {recipe.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="font-weight-bold">Plan Name / Note</Form.Label>
                            <Form.Control 
                                type="text" 
                                placeholder="e.g. My Healthy Breakfast" 
                                value={planName} 
                                onChange={(e) => setPlanName(e.target.value)} 
                                required 
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" style={{ backgroundColor: '#F28123', borderColor: '#F28123' }}>
                            Schedule Meal
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Footer />
        </div>
    )
}

export default withAuth(MealPlanner);