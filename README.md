# CodeAlpha — Task 4: Music Player

A music player built with plain HTML, CSS and JavaScript — no frameworks.

## Files
- `index.html` — song list on the page, full-screen player in a bottom drawer
- `styles.css` — ChatGPT-style grey theme (dark #212121 / #171717, light white / #f9f9f9), amber accent (#f59e0b dark, darker amber in light mode), Poppins headings, Inter body text, flat, no gradients
- `script.js` — audio control, playlist, bottom drawer, seek, volume/mute, autoplay-next toggle, keyboard shortcuts, theme toggle

## Features
- The page opens on the song list — tap any track and a player drawer slides up from the bottom, stopping below the top bar; close it with the back button in its top-left corner, by dragging its top edge down, with the backdrop or Esc (music keeps playing). On desktop (900px and wider) the player is a permanent left column and the song list sits on the right, in a 2 to 1 ratio — no drawer, backdrop, mini player or back button
- Play, pause, previous and next track (the play button shows a pause icon while playing)
- Song title, artist and duration; current time and total time
- Clickable progress bar to seek, with a knob on hover
- Volume slider with a mute button on the left and a plain speaker icon on the right
- Spinning vinyl disc with a lighter border in dark mode, an amber label with a spindle hole, and a small dot that rides on the disc's outer border, centred on the border line (half in, half out), with a curved, blurred trail that follows the border behind it while spinning, so the rotation and motion are visible
- Playlist of 4 tracks — tap any track to play it; the playing track is highlighted and each row shows its duration; tapping the track that is already playing just reopens the player instead of restarting the song
- Likes: tap the heart on a song row or the bare heart at the top-right of the player to like a song (no background or border, filled amber when liked); liked songs form the "Liked" playlist, shown with the All songs / ♥ Liked / Folder filter chips above the list (next/previous move inside the list you are looking at); likes are remembered in the browser
- Import: the Import button on the song list picks individual audio files from the phone and adds them to your songs
- Play audio from a folder on the phone: the folder icon in the top bar lets you pick a folder (e.g. a music folder) and all its audio files (.mp3, .wav, .ogg, .m4a, .flac, .aac, .opus) become a playlist you can play and like; your added songs (imported files and folder songs) are saved in the browser so they are still there after a reload, and "Remove folder" under the filters takes them out again
- Remembers what was playing: the track, position, volume and autoplay choice are saved in the browser, so after a reload or closing and reopening the page the bottom bar shows the same song at the same spot (and resumes playing when the browser allows it)
- Autoplay is a repeat icon in the top bar (amber when on, muted when off; on by default): when a track ends, the next one starts automatically
- Spinning vinyl disc while a track plays (stops when paused; disabled for reduced motion)
- Keyboard shortcuts: Space = play/pause, ←/→ = seek 5s, ↑/↓ = volume
- Light/dark theme toggle, remembered in the browser
- If a track fails to load, a message is shown and the other controls keep working

## Tracks
The player ships with no built-in songs — add your own with the Import button on the song list or the folder icon in the top bar. Your songs are saved in the browser, so they are still there after a reload.

## Run it
Open `index.html` in a browser, or serve the folder, e.g. `python3 -m http.server` and open http://localhost:8000

## Submission
GitHub repo name for CodeAlpha: `CodeAlpha_MusicPlayer`
