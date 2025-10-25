from flask import Flask, jsonify, request
from flask_cors import CORS
import datetime

# --- App Setup ---
application = Flask(__name__) 

# This is the line you will update in the FINAL step before deployment
# For now, we allow all origins for local development
CORS(application) 

# --- In-Memory "Database" ---
expenses = []
next_id = 1

# --- API Endpoints ---

# GET all expenses
@application.route("/api/expenses", methods=["GET"])
def get_expenses():
    return jsonify(expenses)

# POST a new expense
@application.route("/api/expenses", methods=["POST"])
def add_expense():
    global next_id
    data = request.json
    
    # Get today's date if not provided
    date = data.get("date")
    if not date:
        date = datetime.date.today().strftime("%Y-%m-%d")
        
    new_expense = {
        "id": next_id,
        "description": data.get("description"),
        "amount": data.get("amount"),
        "category": data.get("category"),
        "date": date
    }
    expenses.append(new_expense)
    next_id += 1
    
    # Return the new expense, which now includes the ID
    return jsonify(new_expense), 201

# PUT (update) an existing expense
@application.route("/api/expenses/<int:id>", methods=["PUT"])
def update_expense(id):
    data = request.json
    
    # Find the expense to update
    expense_to_update = None
    for expense in expenses:
        if expense["id"] == id:
            expense_to_update = expense
            break
    
    if expense_to_update:
        # Update the fields
        expense_to_update["description"] = data.get("description", expense_to_update["description"])
        expense_to_update["amount"] = data.get("amount", expense_to_update["amount"])
        expense_to_update["category"] = data.get("category", expense_to_update["category"])
        expense_to_update["date"] = data.get("date", expense_to_update["date"])
        
        return jsonify(expense_to_update), 200
    else:
        return jsonify({"message": "Expense not found"}), 404

# DELETE an expense
@application.route("/api/expenses/<int:id>", methods=["DELETE"])
def delete_expense(id):
    global expenses
    
    expense_to_delete = None
    for expense in expenses:
        if expense["id"] == id:
            expense_to_delete = expense
            break
    
    if expense_to_delete:
        expenses.remove(expense_to_delete)
        return jsonify({"message": "Expense deleted"}), 200
    else:
        return jsonify({"message": "Expense not found"}), 404

# --- Run the App ---
if __name__ == "__main__":
    application.run(debug=True, port=5000)