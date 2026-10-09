# Plan

Goal: Start from Photo notebook (A photo notebook with camera and captions). Changes: add a star rating to each photo and a filter to show only starred photos; keep everything else the same.

1. The home page shows the photo notebook: a grid of every saved photo, each with its caption beneath it, and a visible, enabled 'Add photo' control on the page itself that works with no navigation or URL parameter.
2. Clicking 'Take photo' opens the camera preview; capturing adds the new photo to the grid immediately, and if the camera is refused or unavailable a message on the page says so instead of a blank preview.
3. Choosing, dropping or pasting image files through the file input adds each accepted image as its own card in the photo grid, and a file that is not an image is rejected with a visible message rather than silently ignored or added as a broken card.
4. Each photo card has an editable caption: opening it shows a labelled text input inside a form with a 'Save caption' button, and after saving the new caption text appears beneath that photo; saving an empty caption is either refused with a message or stores an empty caption that shows a 'No caption' placeholder — it never breaks the card.
5. Each photo card shows a star rating control of 5 stars; clicking the nth star sets that photo's rating to n and the filled stars visibly show the current rating, clicking a different star changes it again, and clicking the currently-set star (or a visible 'Clear' affordance beside the stars) resets the rating to zero so no stars are filled.
6. A filter control on the page offers 'All photos' and 'Starred only'; with 'Starred only' selected, photos with a zero rating are hidden and only rated photos remain, switching back to 'All photos' shows every photo again, and if no photo has a rating the starred view shows a 'No starred photos yet' message instead of an empty grid. Setting a photo's rating to zero while the starred filter is active hides that photo immediately.
7. In the 'All photos' view, every photo with a rating above zero is visibly marked with a small filled-star indicator on its card, so starred photos can be told apart from unrated ones at a glance without opening the filter.
8. Deleting a photo is a button labelled 'Delete photo' on its card, with a confirmation step; after confirming, the photo and its caption and rating disappear from the grid.
9. Reloading the page restores every photo, its caption and its star rating, read back from the Dexie database — nothing is lost on refresh, including ratings and captions changed just before reloading.
10. With no photos yet, the page shows an empty-state message explaining the notebook is empty, with the 'Add photo' and 'Take photo' controls still available.
11. On a phone-sized screen the photo grid collapses to one or two columns and the camera button, caption form, star controls and filter all remain visible and usable.

These are the outcomes this task is judged against.