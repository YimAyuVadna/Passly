# TicketPass — Machine Learning Implementation

## 1. Project Overview

**TicketPass** is an event ticketing system that allows users to purchase and manage event tickets.

The system uses **QR codes** for ticket validation.

The existing ticket system is responsible for:

- Creating tickets
- Storing ticket and order information
- Generating QR codes
- Scanning QR codes
- Validating tickets
- Managing events and orders

Machine Learning is added to analyze ticket-related data and provide predictions.

The project contains **only one Machine Learning component**:

> **ML #1 — Decision Tree Ticket Type Classifier**

---

# 2. Machine Learning Goal

The goal of the Machine Learning component is to predict whether a ticket is:

```text
DIGITAL
```

or:

```text
PHYSICAL
```

The model learns patterns from previous ticket/order data.

---

# 3. ML #1 — Decision Tree Ticket Type Classifier

## 3.1 Purpose

The purpose of ML #1 is to predict the ticket type:

- `DIGITAL`
- `PHYSICAL`

The model learns patterns from previous ticket/order data and uses those patterns to classify new ticket/order data.

---

# 4. What Does "Supervised Learning" Mean Here?

ML #1 is a **Supervised Learning** problem.

The reason is simple:

> The training data already contains the correct answer, called a **label**.

For example:

| Payment | Price | Quantity | Total | Ticket Type |
|---|---:|---:|---:|---|
| ABA | 10 | 1 | 10 | DIGITAL |
| Cash | 20 | 2 | 40 | PHYSICAL |
| Card | 15 | 1 | 15 | DIGITAL |
| Cash | 10 | 3 | 30 | PHYSICAL |

The last column is the answer that the model is supposed to learn.

```text
Features → Ticket Type
```

For example:

```text
Payment = ABA
Price = 10
Quantity = 1
Total = 10
        ↓
     DIGITAL
```

Because the correct answer is already provided during training, this is **Supervised Learning**.

---

# 5. Why Is It Classification?

ML #1 is also a **Classification** problem.

Classification means predicting a category/class.

Our categories are:

```text
DIGITAL
PHYSICAL
```

There are only two possible classes, so this is a:

> **Binary Classification** problem.

The model does NOT predict a continuous number such as:

```text
$15.72
```

Instead, it predicts a category:

```text
DIGITAL
```

or:

```text
PHYSICAL
```

---

# 6. Why Use a Decision Tree?

The ML #1 model uses a **Decision Tree Classifier**.

A Decision Tree makes predictions by asking a sequence of questions.

Conceptually, it can look like:

```text
              Payment Method?
               /           \
            Cash           Digital
             |                |
        Quantity?          DIGITAL
        /      \
      High      Low
       |         |
   PHYSICAL   DIGITAL
```

The actual trained tree is generated from the training data.

The model decides which features and conditions are useful for separating the classes.

---

# 7. Training Data

The training data is stored in:

```text
training_data.csv
```

The dataset contains **500+ synthetic records** for training the initial model.

The records contain the features required by the classifier and the known ticket type label.

Example structure:

```text
payment_method
unit_price
quantity
total_amount
hour_of_purchase
day_of_week
has_notes
ticket_tier
time_since_purchase_hours
ticket_type
```

The important concept is:

```text
Features → Input
ticket_type → Label / Answer
```

---

# 8. Features

The model uses the following information as input features.

| Feature | Meaning |
|---|---|
| `payment_method` | Method used to pay |
| `unit_price` | Price of one ticket |
| `quantity` | Number of tickets purchased |
| `total_amount` | Total order amount |
| `hour_of_purchase` | Hour when the order was created |
| `day_of_week` | Day when the order was created |
| `has_notes` | Whether the order contains notes |
| `ticket_tier` | Ticket/event tier |
| `time_since_purchase_hours` | Time since the ticket/order was purchased |

These features are used to help the model identify patterns.

---

# 9. Label

The target/label is:

```text
ticket_type
```

It contains:

```text
DIGITAL
```

or:

```text
PHYSICAL
```

During training:

```text
X = Features
y = Ticket Type
```

Conceptually:

```text
X
↓
payment method
unit price
quantity
total amount
purchase time
purchase day
notes
ticket tier
time since purchase

        +

y
↓
DIGITAL / PHYSICAL
```

The Decision Tree learns the relationship between `X` and `y`.

---

# 10. Data Preprocessing

Machine Learning models normally require numerical input.

Some TicketPass data is categorical, such as:

```text
payment_method = ABA
```

or:

```text
ticket_tier = VIP
```

Therefore, categorical values need to be converted into numerical representations before being provided to the model.

The preprocessing must be applied consistently during both:

### Training

```text
Raw training data
      ↓
Preprocessing
      ↓
Decision Tree
```

### Prediction

```text
Ticket/order data
      ↓
Same preprocessing
      ↓
Decision Tree
```

The preprocessing used during training must be saved/reused when making predictions.

---

# 11. Training Process

The model training process is:

```text
training_data.csv
       ↓
Load dataset
       ↓
Separate features and label
       ↓
Preprocess data
       ↓
Split training/testing data
       ↓
Train Decision Tree
       ↓
Evaluate model
       ↓
Save trained model
```

The dataset is divided into:

```text
80% → Training data
20% → Testing data
```

The training data is used to teach the model.

The testing data is used to check how well the trained model performs on data it did not train on.

---

# 12. Decision Tree Configuration

The current Decision Tree uses:

```text
max_depth = 5
```

This limits the maximum depth of the tree.

The purpose is to prevent the tree from becoming unnecessarily complicated and memorizing the training data too closely.

---

# 13. Model Evaluation

After training, the model should be evaluated using the testing dataset.

Important evaluation measurements include:

### Accuracy

Accuracy tells us how many predictions were correct.

Example:

```text
100 test records
90 correct predictions
```

Accuracy:

```text
90%
```

### Confusion Matrix

A confusion matrix shows how predictions are distributed between the two classes.

Conceptually:

```text
                    Predicted
                 DIGITAL  PHYSICAL

Actual DIGITAL     correct   wrong

Actual PHYSICAL    wrong     correct
```

This helps us see whether the model is confusing one ticket type with the other.

### Precision and Recall

These can also be used to understand the classifier's performance in more detail.

---

# 14. Model File

After training, the trained model is saved as:

```text
models/ticket_classifier.pkl
```

The `.pkl` file contains the trained model so that the application does not need to train the model every time it makes a prediction.

The basic idea is:

```text
training_data.csv
       ↓
train_model.py
       ↓
ticket_classifier.pkl
```

Then later:

```text
ticket_classifier.pkl
       ↓
prediction
```

---

# 15. Training Script

The training script is:

```text
train_model.py
```

Its main responsibilities are:

1. Load the training dataset.
2. Prepare the features.
3. Prepare the target label.
4. Preprocess categorical data.
5. Split the dataset into training and testing sets.
6. Train the Decision Tree.
7. Evaluate the model.
8. Save the trained model.

---

# 16. How Ticket Scanning Connects to ML

The important thing is that ML does not replace QR validation.

The process is:

```text
User scans QR code
        ↓
TicketPass reads QR token
        ↓
System finds the ticket/order
        ↓
System validates the ticket
        ↓
Ticket/order information is collected
        ↓
Relevant ML features are prepared
        ↓
Python ML backend
        ↓
Decision Tree
        ↓
DIGITAL / PHYSICAL prediction
```

So:

```text
QR Code
   ↓
Find Ticket
   ↓
Validate Ticket
   ↓
Get Ticket/Order Data
   ↓
ML Prediction
```

---

# 17. Example Prediction

Suppose a user scans a valid ticket.

The system finds the associated order:

```text
Payment Method: ABA
Unit Price: 15
Quantity: 1
Total Amount: 15
Hour of Purchase: 14
Day of Week: Monday
Has Notes: Yes
Ticket Tier: VIP
Time Since Purchase: 48 hours
```

The system converts these values into the format expected by the model.

Then:

```text
Ticket/Order Data
       ↓
Preprocessing
       ↓
Decision Tree
       ↓
Prediction
```

The model may return:

```text
DIGITAL
```

The important point is that the model is **predicting from learned patterns**.

---

# 18. Important Distinction: Existing System vs ML

## Existing TicketPass System

The existing system handles:

```text
QR generation
QR scanning
Ticket lookup
Ticket validation
Order management
Ticket management
```

These are normal application functions.

## Machine Learning

ML handles:

```text
Pattern learning
Prediction
Classification
```

For ML #1:

```text
Ticket/order information
        ↓
Decision Tree
        ↓
DIGITAL / PHYSICAL
```

Therefore, ML is an additional intelligence layer rather than a replacement for the existing ticket system.

---

# 19. Backend Architecture

The planned ML flow uses a Python ML backend.

A simplified architecture is:

```text
React Frontend
      ↓
TicketPass Backend
      ↓
Ticket / Order Data
      ↓
Python ML Backend
      ↓
Decision Tree Model
      ↓
Prediction
      ↓
TicketPass
```

The trained model is loaded by the Python backend.

The Python backend receives the required features and returns the prediction.

---

# 20. Development Phases

## Phase 1 — Prepare Training Data

Create:

```text
training_data.csv
```

with 500+ records.

The dataset must contain:

```text
Features + Ticket Type Label
```

---

## Phase 2 — Train the Model

Create:

```text
train_model.py
```

The script:

```text
Load CSV
   ↓
Preprocess
   ↓
Split data
   ↓
Train Decision Tree
   ↓
Evaluate
   ↓
Save model
```

Output:

```text
models/ticket_classifier.pkl
```

---

## Phase 3 — Create Prediction API

Create a Python backend/API that:

1. Loads the saved model.
2. Receives ticket/order information.
3. Applies the same preprocessing.
4. Sends the data to the model.
5. Returns the prediction.

Example response:

```json
{
  "ticket_type": "DIGITAL"
}
```

---

## Phase 4 — Connect TicketPass

The existing TicketPass system sends the required ticket/order information to the ML API.

Flow:

```text
TicketPass
    ↓
ML API
    ↓
Decision Tree
    ↓
Prediction
    ↓
TicketPass
```

---

# 21. Current Scope

The current development focuses only on:

```text
ML #1
Decision Tree Ticket Type Classifier
```

The target is:

```text
DIGITAL
PHYSICAL
```

This project does **not** include additional Machine Learning models.

---

# 22. Final ML #1 Flow

The complete concept can be summarized as:

```text
                 TRAINING
                    │
                    ▼
          training_data.csv
                    │
                    ▼
             Preprocessing
                    │
                    ▼
          Train/Test Split
                    │
                    ▼
          Train Decision Tree
                    │
                    ▼
          Evaluate the Model
                    │
                    ▼
       ticket_classifier.pkl
                    │
                    │
                    ▼
                PREDICTION
                    │
                    ▼
          TicketPass scans QR
                    │
                    ▼
        Ticket/order is identified
                    │
                    ▼
        Ticket/order is validated
                    │
                    ▼
        Ticket/order data collected
                    │
                    ▼
        ML features are prepared
                    │
                    ▼
             Preprocessing
                    │
                    ▼
          Decision Tree Model
                    │
              ┌─────┴─────┐
              ▼           ▼
           DIGITAL     PHYSICAL
```

---

# 23. Key Concepts to Remember

### Supervised Learning

The model learns from data where the correct answer is already provided.

```text
Input + Correct Answer
        ↓
       Learn
```

### Classification

The model predicts a category.

```text
DIGITAL
PHYSICAL
```

### Decision Tree

The model makes decisions using learned conditions/questions.

```text
Feature
  ↓
Condition
  ↓
Next decision
  ↓
Prediction
```

### Feature

An input used by the model.

Examples:

```text
price
quantity
payment_method
ticket_tier
```

### Label

The correct answer the model learns to predict.

```text
ticket_type
```

### Model

The trained Decision Tree that has learned patterns from the training data.

```text
training data
      ↓
   learning
      ↓
trained model
```

### Prediction

Using the trained model with new data.

```text
New ticket data
      ↓
Trained model
      ↓
DIGITAL / PHYSICAL
```

---

# 24. One-Sentence Explanation

If the teacher asks:

> **What does your ML model do?**

Answer:

> **Our ML model uses a supervised Decision Tree classifier to learn patterns from labeled ticket/order data and predict whether a ticket is DIGITAL or PHYSICAL.**

If the teacher asks:

> **Why is it supervised learning?**

Answer:

> **Because our training dataset contains the correct ticket type label, DIGITAL or PHYSICAL, so the model learns from labeled examples.**

If the teacher asks:

> **Why is it classification?**

Answer:

> **Because the model predicts a category rather than a numerical value. The two categories are DIGITAL and PHYSICAL.**

If the teacher asks:

> **Does the ML scan the QR code?**

Answer:

> **No. QR scanning and ticket validation are normal system functions. After the system identifies the ticket and obtains its related order data, the ML model uses selected data to make the ticket-type prediction.**

---

# 25. Final Summary

The TicketPass Machine Learning implementation contains **only one model**:

```text
┌─────────────────────────────────────┐
│      TicketPass ML Component        │
├─────────────────────────────────────┤
│ Algorithm: Decision Tree            │
│ Learning: Supervised Learning       │
│ Task: Binary Classification         │
│                                     │
│ Input: Ticket/Order Features        │
│ Output: DIGITAL or PHYSICAL         │
└─────────────────────────────────────┘
```

The overall concept is:

```text
Labeled Training Data
        ↓
Decision Tree learns patterns
        ↓
Trained Model
        ↓
New Ticket/Order Data
        ↓
Prediction
        ↓
DIGITAL / PHYSICAL
```

**TicketPass uses one ML model only: Decision Tree Ticket Type Classifier.**