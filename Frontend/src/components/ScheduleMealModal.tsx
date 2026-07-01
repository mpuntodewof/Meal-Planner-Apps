import React, { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store/storeRedux";
import userModel from "../interfaces/userModel";
import {
  useCreateMealPlanMutation,
  useGetMealPlansQuery,
} from "../api/mealPlanApi";
import toastNotify from "../helper/toastNotify";

interface Props {
  show: boolean;
  onHide: () => void;
  recipeId: number;
  recipeName: string;
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];

/**
 * Self-contained "schedule this recipe" modal. The recipe is fixed (passed in);
 * the user picks a date and meal type. Reusable from the recipe detail page and
 * anywhere else that wants to schedule a known recipe. Mirrors the MealPlanner's
 * create logic, including the duplicate pre-check and 409 fallback.
 */
function ScheduleMealModal({ show, onHide, recipeId, recipeName }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mealType, setMealType] = useState("Dinner");
  const [submitting, setSubmitting] = useState(false);

  const userData: userModel = useSelector(
    (state: RootState) => state.userAuthStore,
  );
  const userId = userData.id;

  const { data: mealPlansData } = useGetMealPlansQuery(userId, {
    skip: !userId,
  });
  const [createMealPlan] = useCreateMealPlanMutation();

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toastNotify("Please log in to schedule meals", "error");
      return;
    }

    const selectedStr = format(selectedDate, "yyyy-MM-dd");

    // Duplicate pre-check against already-loaded plans (same recipe + day + meal type).
    const plans = mealPlansData?.result?.$values ?? [];
    const alreadyScheduled = plans.some((p: any) => {
      if (p.recipeId !== recipeId) return false;
      if (p.mealType?.toLowerCase() !== mealType.toLowerCase()) return false;
      const dates: string[] = p.dates?.$values ?? p.dates ?? [];
      return dates.some(
        (d: string) => format(new Date(d), "yyyy-MM-dd") === selectedStr,
      );
    });
    if (alreadyScheduled) {
      toastNotify(
        `This recipe is already in ${mealType} for the selected day.`,
        "error",
      );
      return;
    }

    const planDateStr = format(selectedDate, "yyyy-MM-dd'T'00:00:00");
    const payload = {
      planName: `${mealType} - ${recipeName}`,
      mealType,
      startDate: planDateStr,
      endDate: planDateStr,
      recipeId,
      userID: userId,
      mealPlanDaysDTO: [{ date: planDateStr }],
    };

    try {
      setSubmitting(true);
      await createMealPlan(payload).unwrap();
      toastNotify("Meal scheduled successfully", "success");
      onHide();
    } catch (err: any) {
      console.error("Error creating meal plan:", err);
      if (err?.status === 409) {
        toastNotify(
          `This recipe is already in ${mealType} for the selected day.`,
          "error",
        );
      } else {
        toastNotify("Failed to schedule meal plan", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      dialogClassName="schedule-meal-modal"
    >
      {/* Make react-datepicker's wrapper span the full field width so its input
          lines up with the other controls (it defaults to shrink-to-content). */}
      <style>{`
        .schedule-meal-modal .react-datepicker-wrapper,
        .schedule-meal-modal .react-datepicker__input-container { display: block; width: 100%; }
        .schedule-meal-modal .modal-body { padding: 24px; }
        /* Every field stacks label-above-control, full width. */
        .schedule-meal-modal .sm-label { display: block; font-weight: 700; font-size: 13px; letter-spacing: .3px; margin-bottom: 6px; color: #1f1d1a; }
        .schedule-meal-modal .form-control,
        .schedule-meal-modal .form-select { display: block; width: 100%; }
      `}</style>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontWeight: 800 }}>Add to Meal Plan</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSchedule}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="sm-label">Recipe</Form.Label>
            <Form.Control type="text" value={recipeName} disabled readOnly />
            <Form.Text className="text-muted">Scheduling this recipe</Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="sm-label">Date</Form.Label>
            <DatePicker
              selected={selectedDate}
              onChange={(d: Date | null) => d && setSelectedDate(d)}
              dateFormat="EEEE, MMMM d, yyyy"
              minDate={new Date()}
              className="form-control"
            />
          </Form.Group>
          <Form.Group className="sm-field">
            <Form.Label className="sm-label">Meal Category</Form.Label>
            <Form.Select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="form-control"
            >
              {MEAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            style={{
              backgroundColor: "#F28123",
              borderColor: "#F28123",
              fontWeight: 700,
            }}
          >
            {submitting ? "Scheduling…" : "Schedule Meal"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default ScheduleMealModal;
