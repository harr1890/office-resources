# Office Resources site

A simple, no-build website for the office: forms, links, images, and videos.
No npm, no installs — plain HTML/CSS/Bootstrap. **Content is managed from the page itself
via the "Edit page" button** — no coding needed.

## How to view it

Double-click `index.html` to open it in a browser.

> Embedded videos sometimes need a real (not `file://`) page. If they
> don't show, run a tiny local server (optional):
> ```
> python3 -m http.server 8000
> ```
> then visit http://localhost:8000

## Edit passcode

The **Edit page** button asks for a passcode first, so casual visitors can't change things
by accident. The default is `office` — change it in two ways:

- Edit the `editPasscode` line near the top of `data.js`, **or**
- Open the Edit panel and click **Change passcode**.

This is a light deterrent, **not strong security** — a tech-savvy person could read it from
the page source. It exists to prevent accidental edits, which is the real risk on a shared
computer. Leave the passcode blank to turn the gate off.

## Adding & editing content (no code)

Click **Edit page** (top right) and enter the passcode. From there you can:

- **Add an item** — pick a section (or type a new section name), choose a type, and fill in
  title, link/URL, an optional description, and a width.
- **Edit / delete / reorder** any item, and rename/reorder/delete sections.

### Item types

| Type    | What it does                                                          |
|---------|----------------------------------------------------------------------|
| `form`  | Button to a fillable form. Opens in a **new tab**, never auto-downloads. |
| `link`  | A normal hyperlink (opens in a new tab).                            |
| `pdf`   | Opens the PDF in the **current tab** or a **new tab**. Never auto-downloads. |
| `image` | Shows the image on the page. Click to enlarge.                     |
| `video` | Plays on the page (YouTube, Vimeo, or `.mp4`/`.webm` files).       |

### Width

`Normal` (third of a row), `Large` (half), or `Full width`.

## Where edits are saved (important)

Edits save to **this computer's browser** automatically. They are not shared to other
computers on their own.

- **One shared office computer / kiosk?** You're done — edits just stick.
- **Hosted for many people?** After editing, click **Export** to download a fresh
  `data.js`, and replace the site's `data.js` with it. Everyone then sees the update.
  Use **Import** to load a `data.js` someone exported. **Reset to defaults** discards this
  computer's local edits.

## Adding PDFs and other files

Because the site has no server, a file's actual bytes live in a folder next to the site:

1. Copy your file into the **`files/`** folder (or images into `images/`).
2. In the Edit panel, click **Choose file** and pick that same file. It auto-fills the URL
   as `files/your-file.pdf`, guesses the type, and reminds you to copy the file in.
   (You can also just type the path yourself, e.g. `files/cbc-form.pdf`.)
3. Pick a width to control the size of its resource card.

A `pdf` item has **Open PDF** and **Open in new tab** buttons; it is never embedded
inside the resource page and never auto-downloads.

## Files

- `index.html` — the page and the Edit panel.
- `css/style.css` — styling.
- `app.js` — rendering + Edit panel logic (no need to edit).
- `data.js` — the **default/seed** content the page starts with, and the file you replace
  to publish changes on a hosted site.
