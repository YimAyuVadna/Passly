
import os
import numpy as np
import pandas as pd

np.random.seed(42)

def generate_ticket_dataset(n_sample=600):
    

    records = []

    for _ in range(n_sample):

        is_physical = np.random.choice([0, 1], p=[0.70, 0.30])

        if is_physical == 0:

            payment_method = np.random.choice([2, 3], p=[0.35, 0.65])

            hour_of_purchase = int(np.random.choice(range(24)))

            time_since_purchase_hours = round(float(np.random.uniform(24.0, 720.0)), 1)

            quantity = int(np.random.choice([1, 2, 3, 4, 5, 6], p=[0.40, 0.30, 0.15, 0.08, 0.04, 0.03]))

            ticket_tier = int(np.random.choice([0, 1, 2], p=[0.45, 0.35, 0.20]))

            has_notes = int(np.random.choice([0, 1], p=[0.92, 0.08]))

        else:

            payment_method = np.random.choice([0 ,1], p=[0.65, 0.35])

            hour_of_purchase = int(np.random.choice(
                range(24),
                p=[0.01]*12 + [0.02]*3 + [0.10, 0.15, 0.20, 0.19, 0.10, 0.05] + [0.01]*3))
            
            time_since_purchase_hours = round(float(np.random.uniform(0.5, 8.0)), 1)

            quantity = int(np.random.choice([1, 2, 3], p=[0.70, 0.25, 0.05]))

            ticket_tier = int(np.random.choice([0, 1, 2], p=[0.60, 0.10, 0.30]))

            has_notes = int(np.random.choice([0, 1], p=[0.20, 0.80]))

        tier_base_prices = {0: 15.0, 1: 25.0, 2: 50.0}
        base_price = tier_base_prices[ticket_tier]
        unit_price = round(float(base_price + np.random.choice([-3, 0, 5, 10])), 2)
        total_amount = round(float(unit_price * quantity), 2)


        day_of_week = int(np.random.choice(range(7), p=[0.10, 0.10, 0.10, 0.10, 0.20, 0.25, 0.15]))

        records.append({
            'payment_method': payment_method,
            'unit_price': unit_price,
            'quantity': quantity,
            'total_amount': total_amount,
            'hour_of_purchase': hour_of_purchase,
            'day_of_week': day_of_week,
            'has_notes': has_notes,
            'ticket_tier': ticket_tier,
            'time_since_purchase_hours': time_since_purchase_hours,
            'label': is_physical
        })

    df = pd.DataFrame(records)
    return df


def generate_attendance_dataset(n_events=150):

    records = []

    for i in range(n_events):
        capacity = int(np.random.choice([100, 200, 300, 500, 800, 1000]))

        sold_percent = np.random.uniform(0.60, 1.0)
        tickets_sold = int(capacity * sold_percent)

        avg_ticket_price = round(float(np.random.uniform(10.0, 60.0)), 2)
        day_of_week = int(np.random.choice(range(7)))
        is_weekend = 1 if day_of_week in [4, 5, 6] else 0

        base_turnout = 0.88 + (0.04 if is_weekend else -0.03)
        noise = np.random.normal(0, 0.03)
        turnout_rate = np.clip(base_turnout + noise, 0.70, 0.98)

        actual_attendance = int(tickets_sold * turnout_rate)

        records.append({
            'tickets_sold': tickets_sold,
            'event_capacity': capacity,
            'avg_ticket_price': avg_ticket_price,
            'day_of_week': day_of_week,
            'is_weekend': is_weekend,
            'actual_attendance': actual_attendance
        })


    return pd.DataFrame(records)

if __name__ == '__main__':

    os.makedirs('data', exist_ok=True)

    df_tickets = generate_ticket_dataset(600)
    ticket_path = os.path.join('data', 'training_data.csv')
    df_tickets.to_csv(ticket_path, index=False)


    print("=" * 55)
    print(" Member 1: Dataset Generation Successful!")
    print("=" * 55)
    print(f" Ticket Data saved to: {ticket_path}")
    print(f" Total Samples: {len(df_tickets)}")
    print(f"  - Digital (0): {(df_tickets['label'] == 0).sum()} ({(df_tickets['label']== 0).mean()*100:.1f}%)")
    print(f"  - Physical (1): {(df_tickets['label'] == 1).sum()} ({(df_tickets['label']== 1).mean()*100:.1f}%)")


    df_attendance = generate_attendance_dataset(150)
    attendance_path = os.path.join('data', 'attendance_data.csv')
    df_attendance.to_csv(attendance_path, index=False)

    print("\n" + "=" * 55)
    print(f" Attendance Data saved to: {attendance_path}")
    print(f" Total Historical Events: {len(df_attendance)}")
    print("=" * 55)