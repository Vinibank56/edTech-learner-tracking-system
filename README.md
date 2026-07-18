
 Features
- Admin authentication with JWT (access + refresh tokens)
- Rule-based scoring engine (login frequency, assignments, recency)
- Daily batch job (2 AM cron) for scoring and classification
- Automated nudge system for At-Risk learners
- Suppress/resend controls for admin
- 48-hour outcome tracking and analytics dashboard

 Architecture
- MVC pattern with services layer
- Centralized error handling
- Request validation (express-validator)
- HTTP-only cookie storage for tokens

 Database
- 5 collections: Users, Learners, Scores, Nudges, Outcomes
- Aggregated stats for dashboard

 Email
- SendGrid integration
- HTML + plain text templates

 Security
- bcrypt password hashing
- Token rotation
- Refresh token revocation
- Role-based authorization"