import React from 'react'

function Features() {
  return (
	<div className="list-section pt-100 pb-100">
		<div className="container">

			<div className="row">
				<div className="col-lg-3 col-md-6 mb-4 mb-lg-0">
					<div className="list-box d-flex align-items-center">
						<div className="list-icon">
							<i className="fa fa-shield-alt"></i>
						</div>
						<div className="content">
							<h3>Authentication</h3>
							<p>User Management</p>
						</div>
					</div>
				</div>
				<div className="col-lg-3 col-md-6 mb-4 mb-lg-0">
					<div className="list-box d-flex align-items-center">
						<div className="list-icon">
							<i className="fas fa-utensils"></i>
						</div>
						<div className="content">
							<h3>Receipe Management</h3>
							<p>Food Receipe Reference</p>
						</div>
					</div>
				</div>
				<div className="col-lg-3 col-md-6">
					<div className="list-box d-flex justify-content-start align-items-center">
						<div className="list-icon">
							<i className="fas fa-clipboard-list"></i>
						</div>
						<div className="content">
							<h3>Meal Plan</h3>
							<p>Customize your meal plan</p>
						</div>
					</div>
				</div>
				<div className="col-lg-3 col-md-6">
					<div className="list-box d-flex justify-content-start align-items-center">
						<div className="list-icon">
							<i className="fas fa-shopping-bag"></i>
						</div>
						<div className="content">
							<h3>Shopping List of Ingredient</h3>
							<p></p>
						</div>
					</div>
				</div>
			</div>

		</div>
	</div>
  )
}

export default Features