DS BM Competition - Live scoreboard (Storebrand DS-styled)

How to run locally:

1) Install dependencies
   npm install

2) Run locally with ADMIN_TOKEN environment:
   ADMIN_TOKEN=yourkey npm start
   Open http://localhost:3000

Docker:
   docker build -t ds-bm-competition .
   docker run -p 3000:3000 -e ADMIN_TOKEN=yourkey -v $(pwd)/data:/app/data ds-bm-competition

Render:
 - Push this repo to GitHub
 - Create new Web Service on Render, choose "Docker" and point to this repo or use the included render.yaml
 - Set environment variable ADMIN_TOKEN in Render settings

Notes:
 - Admin API is protected with x-admin-token header. Admin page stores token in localStorage.
 - TV page is public read-only.
