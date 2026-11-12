import random
from datetime import date, timedelta
from faker import Faker

fake = Faker('en_IN')

def generate_sql():
    sql_lines = []
    sql_lines.append("-- Auto-generated complete seed dataset matching exact schema")
    sql_lines.append("TRUNCATE job_category, skill, contractor, worker, job, job_skill, worker_skill, application, payment, rating RESTART IDENTITY CASCADE;\n")

    # 1. Job Categories (5 records)
    categories = ['Construction', 'Plumbing', 'Electrical', 'Carpentry', 'Painting']
    for cat in categories:
        sql_lines.append(f"INSERT INTO job_category (category_name) VALUES ('{cat}');")

    # 2. Skills (8 records)
    skills = ['Masonry', 'Welding', 'Pipe Fitting', 'Wiring', 'House Painting', 'Tile Setting', 'Drywall Repair', 'HVAC Repair']
    for sk in skills:
        sql_lines.append(f"INSERT INTO skill (skill_name) VALUES ('{sk}');")

    # 3. Contractors (8 records) -> IDs 1 to 8
    num_contractors = 8
    for _ in range(num_contractors):
        company = fake.company().replace("'", "''")
        name = fake.name().replace("'", "''")
        email = fake.company_email()
        phone = fake.msisdn()[:10]
        city = fake.city().replace("'", "''")
        sql_lines.append(f"INSERT INTO contractor (company_name, contact_person, phone, email, city) VALUES ('{company}', '{name}', '{phone}', '{email}', '{city}');")

    # 4. Workers (30 records) -> IDs 1 to 30
    num_workers = 30
    for _ in range(num_workers):
        name = fake.name().replace("'", "''")
        email = fake.email()
        phone = fake.msisdn()[:10]
        exp = random.randint(1, 15)
        city = fake.city().replace("'", "''")
        wage = random.choice([800, 1000, 1200, 1500, 1800, 2000])
        sql_lines.append(f"INSERT INTO worker (full_name, phone, email, city, experience_years, expected_daily_wage, is_available) VALUES ('{name}', '{phone}', '{email}', '{city}', {exp}, {wage}.00, TRUE);")

    # 5. Jobs (15 records) -> IDs 1 to 15
    num_jobs = 15
    job_titles = [
        'Site Repair Specialist', 'Commercial Electrical Overhaul', 'Residential Leak Maintenance',
        'Substation Cable Repair', 'Custom Cabinet Assembly', 'Exterior Wall Painting',
        'Concrete Slab Masonry', 'Interior Remodeling Heavy Lift', 'HVAC Duct Maintenance',
        'Tile & Flooring Installation', 'Plumbing Overhaul', 'Structural Welding Job',
        'Warehouse Wiring', 'Drywall Installation', 'Full House Paint Work'
    ]
    
    today = date.today()
    for i in range(num_jobs):
        c_id = random.randint(1, num_contractors)
        cat_id = random.randint(1, len(categories))
        title = job_titles[i]
        desc = fake.sentence(nb_words=8).replace("'", "''")
        city = fake.city().replace("'", "''")
        pay = random.choice([1000, 1200, 1500, 1800, 2200])
        pay_type = random.choice(['daily', 'hourly', 'fixed'])
        workers_req = random.randint(1, 4)
        start_d = today + timedelta(days=random.randint(1, 10))
        end_d = start_d + timedelta(days=random.randint(5, 30))
        status = 'completed' if i == 6 else random.choice(['open', 'open', 'in_progress', 'completed'])
        sql_lines.append(f"INSERT INTO job (contractor_id, category_id, title, description, location, pay_amount, pay_type, workers_needed, start_date, end_date, status) VALUES ({c_id}, {cat_id}, '{title}', '{desc}', '{city}', {pay}.00, '{pay_type}', {workers_req}, '{start_d}', '{end_d}', '{status}');")

    # 6. Worker Skills Mapping
    proficiencies = ['beginner', 'intermediate', 'expert']
    for w_id in range(1, num_workers + 1):
        assigned_skills = random.sample(range(1, len(skills) + 1), k=random.randint(1, 3))
        for s_id in assigned_skills:
            yrs = random.randint(1, 10)
            prof = random.choice(proficiencies)
            sql_lines.append(f"INSERT INTO worker_skill (worker_id, skill_id, years_experience, proficiency) VALUES ({w_id}, {s_id}, {yrs}, '{prof}');")

    # 7. Job Skills Mapping
    for j_id in range(1, num_jobs + 1):
        req_skills = random.sample(range(1, len(skills) + 1), k=random.randint(1, 3))
        for s_id in req_skills:
            min_yrs = random.randint(1, 4)
            sql_lines.append(f"INSERT INTO job_skill (job_id, skill_id, min_years_required) VALUES ({j_id}, {s_id}, {min_yrs});")

    # --- DEMO PLANTED TEST CASE (Guarantees Worker 1 & Worker 2 match Job 1) ---
    sql_lines.append("\n-- Planted demo case for Matching Workers testing")
    sql_lines.append("DELETE FROM job_skill WHERE job_id = 1;")
    sql_lines.append("INSERT INTO job_skill (job_id, skill_id, min_years_required) VALUES (1, 1, 2), (1, 2, 2);")
    
    sql_lines.append("DELETE FROM worker_skill WHERE worker_id = 1;")
    sql_lines.append("INSERT INTO worker_skill (worker_id, skill_id, years_experience, proficiency) VALUES (1, 1, 5, 'expert'), (1, 2, 5, 'expert');")

    sql_lines.append("DELETE FROM worker_skill WHERE worker_id = 2;")
    sql_lines.append("INSERT INTO worker_skill (worker_id, skill_id, years_experience, proficiency) VALUES (2, 1, 6, 'expert'), (2, 2, 6, 'expert');")

    # 8. Applications
    app_statuses = ['applied', 'shortlisted', 'accepted', 'rejected', 'withdrawn', 'completed']
    created_apps = set()
    app_id_counter = 1
    accepted_completed_app_ids = []

    while len(created_apps) < 30:
        j_id = random.randint(1, num_jobs)
        w_id = random.randint(1, num_workers)
        if (j_id, w_id) not in created_apps:
            created_apps.add((j_id, w_id))
            st = random.choice(app_statuses)
            if st in ['accepted', 'completed']:
                accepted_completed_app_ids.append(app_id_counter)
            sql_lines.append(f"INSERT INTO application (job_id, worker_id, status, applied_at) VALUES ({j_id}, {w_id}, '{st}', NOW() - INTERVAL '{random.randint(1, 10)} days');")
            app_id_counter += 1

    # 9. Payments
    methods = ['cash', 'upi', 'bank_transfer']
    p_statuses = ['pending', 'paid']
    payment_apps = random.sample(accepted_completed_app_ids, k=min(5, len(accepted_completed_app_ids)))
    for app_id in payment_apps:
        amt = random.choice([2000, 3500, 5000])
        m = random.choice(methods)
        ps = random.choice(p_statuses)
        paid_d = today - timedelta(days=random.randint(1, 10))
        sql_lines.append(f"INSERT INTO payment (application_id, amount, paid_on, method, status) VALUES ({app_id}, {amt}.00, '{paid_d}', '{m}', '{ps}');")

    # 10. Ratings
    reviews = ['Excellent work and very punctual.', 'Great technical skills.', 'Punctual and efficient execution.']
    rating_apps = random.sample(accepted_completed_app_ids, k=min(5, len(accepted_completed_app_ids)))
    for app_id in rating_apps:
        score = random.randint(3, 5)
        rev = random.choice(reviews)
        sql_lines.append(f"INSERT INTO rating (application_id, score, comment) VALUES ({app_id}, {score}, '{rev}');")

    # Write to seed.sql
    with open('sql/seed/seed.sql', 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_lines))

    print("Successfully generated complete schema-compliant seed script in sql/seed/seed.sql!")

if __name__ == '__main__':
    generate_sql()