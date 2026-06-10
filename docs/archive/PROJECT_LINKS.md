# Legacy Odyssey - Project Links & Accounts

## Live Site
| URL | Status |
|-----|--------|
| https://legacyodyssey.com | Active (Railway custom domain) |
| https://www.legacyodyssey.com | Pending DNS setup |
| https://legacy-odyssey-production-a9d1.up.railway.app | Railway auto-generated public URL |

---

## GitHub
| Item | Link |
|------|------|
| Primary Repo (deploys to Railway) | https://github.com/dragno65/legacy-odyssey |
| Secondary Repo (local git origin) | https://github.com/dragno6565-ship-it/legacy-odyssey |
| GitHub Account (primary) | **dragno65** |
| GitHub Account (secondary) | **dragno6565-ship-it** |
| Personal Access Tokens (dragno65) | https://github.com/settings/tokens |

> **Note:** Railway auto-deploys from the **dragno65** repo. The **dragno6565-ship-it** repo is set as `origin` in local git. Both are kept in sync.

---

## Railway (Hosting)
| Item | Link / Value |
|------|--------------|
| Project Dashboard | https://railway.com/project/25a7cbc7-64da-4012-bf24-5b20a0bc4839 |
| Service Settings | https://railway.com/project/25a7cbc7-64da-4012-bf24-5b20a0bc4839/service/a759cd1b-34ae-4171-8e4b-9259e0e95dda/settings |
| Deployments | https://railway.com/project/25a7cbc7-64da-4012-bf24-5b20a0bc4839/service/a759cd1b-34ae-4171-8e4b-9259e0e95dda |
| Project ID | `25a7cbc7-64da-4012-bf24-5b20a0bc4839` |
| Service ID | `a759cd1b-34ae-4171-8e4b-9259e0e95dda` |
| Project Name | romantic-creation |
| Environment | production |
| Region | US West (California, USA) |
| Port | 3000 |

### Custom Domains on Railway
| Domain | CNAME Target | Status |
|--------|-------------|--------|
| legacyodyssey.com | dvxu6374.up.railway.app | Active |
| www.legacyodyssey.com | tdt5meaj.up.railway.app | Pending DNS |

### DNS Records Needed for www.legacyodyssey.com
| Type | Name | Value |
|------|------|-------|
| CNAME | www | tdt5meaj.up.railway.app |
| TXT | _railway-verify.www | railway-verify=a66792830cbeff1399f1b9b5aa4aec4fc3f39a352cd09e251519af42f1702d74 |

---

## Supabase (Database & Storage)
| Item | Link / Value |
|------|--------------|
| Dashboard | https://supabase.com/dashboard/project/vesaydfwwdbbajydbzmq |
| SQL Editor | https://supabase.com/dashboard/project/vesaydfwwdbbajydbzmq/sql |
| Table Editor | https://supabase.com/dashboard/project/vesaydfwwdbbajydbzmq/editor |
| Storage (Photos) | https://supabase.com/dashboard/project/vesaydfwwdbbajydbzmq/storage/buckets/photos |
| API URL | `https://vesaydfwwdbbajydbzmq.supabase.co` |
| Project Ref | `vesaydfwwdbbajydbzmq` |
| Account Email | dragno6565@gmail.com |

---

## Expo / EAS (Mobile Builds)
| Item | Link / Value |
|------|--------------|
| Expo Project | https://expo.dev/accounts/dragno65/projects/legacy-odyssey |
| Latest APK Build | https://expo.dev/accounts/dragno65/projects/legacy-odyssey/builds/d9bc9bb2-1f33-47e5-8de1-ede6c21c0d66 |
| All Builds | https://expo.dev/accounts/dragno65/projects/legacy-odyssey/builds |
| EAS Project ID | `14daf713-2b41-4ac0-b413-1179afa6e6a9` |
| Expo Account | **dragno65** |

---

## Local Development
| Item | Value |
|------|-------|
| Project Directory | `E:\Claude\legacy-odyssey` |
| Server Code | `E:\Claude\legacy-odyssey\src\` |
| Mobile App Code | `E:\Claude\legacy-odyssey\mobile\` |
| Supabase Migrations | `E:\Claude\legacy-odyssey\supabase\migrations\` |
| EJS Templates | `E:\Claude\legacy-odyssey\src\views\` |

### Key Server Files
- **API Routes:** `src/routes/api/books.js`
- **Book Service:** `src/services/bookService.js`
- **Family Resolver:** `src/middleware/resolveFamily.js`
- **Book Layout:** `src/views/layouts/book.ejs`
- **Welcome Page:** `src/views/book/welcome.ejs`
- **Sidebar:** `src/views/book/sidebar.ejs`

### Key Mobile Files
- **Photo Picker:** `mobile/src/components/PhotoPicker.js`
- **Child Info Screen:** `mobile/src/screens/ChildInfoScreen.js`

---

## Architecture Overview
```
User (Browser) --> legacyodyssey.com --> Railway (Express, Port 3000)
                                             |
                                             +--> Supabase (PostgreSQL DB + Storage)

User (Android)  --> React Native App (Expo) --> Railway API --> Supabase
```

- **Server:** Express.js with EJS templates for the web book viewer
- **Mobile:** React Native (Expo) for the companion app
- **Database:** Supabase (PostgreSQL) with row-level security
- **Storage:** Supabase Storage (public `photos` bucket)
- **Hosting:** Railway (auto-deploys from GitHub on push to main)
- **Mobile Builds:** EAS Build (Expo Application Services)
