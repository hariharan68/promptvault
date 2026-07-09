promptvault-ai/
│
├── backend/
│   │
│   ├── app/
│   │   │
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   │
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── group.py
│   │   │   ├── prompt.py
│   │   │   ├── tag.py
│   │   │   └── refresh_token.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── group.py
│   │   │   ├── prompt.py
│   │   │   └── tag.py
│   │   │
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── groups.py
│   │   │   ├── prompts.py
│   │   │   ├── tags.py
│   │   │   └── dashboard.py
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── group_service.py
│   │   │   ├── prompt_service.py
│   │   │   └── tag_service.py
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── response.py
│   │
│   ├── requirements.txt
│   ├── .env
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   │
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   │
│   │   ├── pages/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── routes/
│   │   └── utils/
│   │
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env
│
├── docker-compose.yml
├── README.md
└── .gitignore