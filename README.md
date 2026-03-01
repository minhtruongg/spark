# Spark ✦

> *A place to say something you've never said out loud.*

**Spark** is a daily creative expression community where people respond to a shared prompt, post anonymously or under their identity, and connect through honest creative writing.

Live site: [isawspark.netlify.app](https://isawspark.netlify.app)

---

## Features

- **Daily prompt** — everyone responds to the same question
- **Anonymous or identity posting** — post freely or build a profile
- **User authentication** — sign up, sign in, persistent profiles
- **Streak tracking** — daily posting streaks to build a habit
- **Image uploads** — attach images to posts with client-side compression
- **Content moderation** — keyword filtering + community reporting system
- **Pinterest-style masonry feed** — cards glow brighter as they get more likes
- **Shareable image cards** — generate a beautiful card from any post using Canvas API, download or copy a link
- **Color picking** — choose a color that represents your mood when posting

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JavaScript, HTML, CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Deployment | Netlify |

---

## Project Structure

```
spark/
├── index.html          # Main HTML, prompt, submit form
├── css/
│   └── style.css       # All styles — dark night sky aesthetic
└── js/
    ├── config.js       # Supabase client + session ID
    ├── prompts.js      # Daily prompt logic
    ├── moderation.js   # Keyword filter + leet speak normalization
    ├── auth.js         # Sign up, sign in, auth state management
    ├── profile.js      # Profile modal, streak calculation
    ├── feed.js         # Feed rendering, likes, reports, glow effects
    ├── share.js        # Canvas card generator, share modal
    └── main.js         # Init, color picker, image upload, post submit
```

---

## Database Schema

```sql
-- User profiles linked to Supabase auth
profiles (
  id uuid references auth.users,
  username text unique,
  bio text,
  streak int,
  last_post_date timestamptz,
  total_posts int,
  total_likes int
)

-- Community posts
posts (
  id uuid,
  text text,
  image_url text,
  user_id uuid references profiles(id),
  is_anonymous bool,
  color text,
  likes int,
  liked_by text[],
  report_count int,
  created_at timestamp
)

-- Reports
reports (
  id uuid,
  post_id uuid references posts(id),
  reason text,
  created_at timestamp
)
```

---

## Getting Started

1. Clone the repo
```bash
git clone https://github.com/minhtruongg/spark.git
cd spark/spark2
```

2. Add your Supabase credentials in `js/config.js`
```js
const SUPABASE_URL = 'your-project-url'
const SUPABASE_KEY = 'your-anon-key'
```

3. Run with a local server
```bash
python -m http.server 3000
# or
npx serve .
```

4. Open `localhost:3000`

---

## Roadmap

- [ ] Email notifications — daily prompt reminder
- [ ] Comments — reply to specific posts
- [ ] Style matching — AI surfaces users with similar writing styles
- [ ] Monthly Wrapped — AI analysis of your month's posts with a song recommendation
- [ ] Following system

---

Built by [Nguyen Hoang Minh Truong](https://github.com/minhtruongg)
