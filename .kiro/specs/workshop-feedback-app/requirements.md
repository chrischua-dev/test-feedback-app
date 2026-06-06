# Requirements Document

## Introduction

The Workshop Feedback App is a beginner-friendly, single-page web application built for a 90-minute AWS Amplify workshop. It teaches participants how to build a React + TypeScript + Vite frontend and progressively connect it to a cloud backend using AWS Amplify Gen 2 Data.

The app lets workshop attendees submit feedback (name, star rating, and a short comment) and view all submitted entries on the same page. In a later workshop step, feedback is persisted and reloaded using AWS Amplify Data, giving participants a concrete, end-to-end cloud data experience. The app has no authentication, no admin views, and no analytics — intentionally scoped to stay approachable for beginners.

## Glossary

- **App**: The Workshop Feedback App — the single-page React application being built.
- **Feedback_Form**: The UI section that collects a participant's name, rating, and comment.
- **Feedback_Entry**: A single submitted piece of feedback containing a name, a numeric rating (1–5), a comment string, and a unique ID.
- **Feedback_List**: The UI section that displays all submitted Feedback_Entry items.
- **Rating**: An integer from 1 to 5 (inclusive) representing the participant's satisfaction score.
- **Local_State**: In-memory React state held in the browser, not persisted between page reloads.
- **Amplify_Data**: The AWS Amplify Gen 2 Data service used to persist Feedback_Entry items in the cloud.
- **Validator**: The client-side logic that checks Feedback_Form inputs before submission.

---

## Requirements

### Requirement 1: Feedback Form — Name Input

**User Story:** As a workshop participant, I want to enter my name in the feedback form, so that my feedback is attributed to me.

#### Acceptance Criteria

1. THE App SHALL render a text input with `type="text"`, a visible `<label>` whose `for` attribute matches the input's `id`, placeholder text "Your name", inside the Feedback_Form.
2. WHEN a participant types in the Name field, THE Feedback_Form SHALL update the name value in Local_State on each keystroke.
3. IF the Name field value, after trimming leading and trailing whitespace, is empty when the form is submitted, THEN THE Validator SHALL prevent submission and display the error message "Name is required" immediately below the Name field.
4. THE Feedback_Form SHALL enforce a maximum of 100 characters in the Name field, blocking input beyond that limit.

---

### Requirement 2: Feedback Form — Star Rating

**User Story:** As a workshop participant, I want to choose a rating from 1 to 5 stars, so that I can express how satisfied I am with the workshop.

#### Acceptance Criteria

1. THE Feedback_Form SHALL render exactly 5 star elements, each with a keyboard-accessible role (`button` or `radio`), labelled 1 through 5.
2. WHEN a participant selects a star of value N, THE Feedback_Form SHALL apply a distinct visual fill or color change to stars 1 through N, and SHALL store N as the selected Rating in Local_State.
3. IF no rating has been selected when the form is submitted, THEN THE Validator SHALL prevent submission and display the error message "Please select a rating" immediately below the star rating group.
4. WHEN a participant selects a different star after having already selected one, THE Feedback_Form SHALL update Local_State to the newly selected Rating value and update the visual highlight accordingly.

---

### Requirement 3: Feedback Form — Comment Input

**User Story:** As a workshop participant, I want to type a short comment, so that I can share specific thoughts about the workshop.

#### Acceptance Criteria

1. THE Feedback_Form SHALL render a `<textarea>` with a visible `<label>` whose `for` attribute matches the textarea's `id`, with a minimum of 3 visible rows.
2. WHEN a participant types in the Comment field, THE Feedback_Form SHALL update the comment value in Local_State on each keystroke and SHALL display a remaining-character count (e.g., "480 / 500 characters remaining").
3. IF the Comment field value, after trimming leading and trailing whitespace, is empty when the form is submitted, THEN THE Validator SHALL prevent submission and display the error message "Comment is required" immediately below the Comment field.
4. THE Feedback_Form SHALL enforce a maximum of 500 characters in the Comment field, blocking any additional input once the limit is reached.

---

### Requirement 4: Feedback Submission

**User Story:** As a workshop participant, I want to submit my feedback, so that it is added to the list of entries on the page.

#### Acceptance Criteria

1. THE Feedback_Form SHALL render a Submit button labelled "Submit Feedback".
2. WHEN a participant clicks Submit Feedback and all fields pass validation, THE App SHALL add a new Feedback_Entry — containing the submitted name, Rating, comment, and a unique ID — to Local_State.
3. WHEN a Feedback_Entry is successfully added to Local_State, THE Feedback_Form SHALL reset the Name field to `""`, the Rating to no-selection (null), and the Comment field to `""`.
4. WHEN a Feedback_Entry is successfully added to Local_State, THE App SHALL display the updated Feedback_List within the same render cycle, without a page reload.
5. WHEN a new Feedback_Entry is added to Local_State, THE Feedback_List SHALL display that entry at the top of the list (most recent first).

---

### Requirement 5: Feedback List Display

**User Story:** As a workshop participant, I want to see all submitted feedback entries on the page, so that I can read what others thought about the workshop.

#### Acceptance Criteria

1. THE Feedback_List SHALL display every Feedback_Entry currently held in Local_State.
2. THE Feedback_List SHALL render each Feedback_Entry showing the participant's name, the Rating as a numeric digit followed by "/ 5" (e.g., "4 / 5"), and the comment.
3. WHILE Local_State contains zero Feedback_Entry items, THE Feedback_List SHALL display the message "No feedback yet. Be the first to share yours!" as soon as the App renders.
4. WHEN a new Feedback_Entry is added to Local_State, THE Feedback_List SHALL render entries in reverse-chronological order (most recent entry first) without a full page reload.

---

### Requirement 6: Cloud Persistence with Amplify Data

**User Story:** As a workshop participant completing the cloud integration step, I want my submitted feedback to be saved to AWS Amplify Data, so that entries survive page reloads and are visible to all participants.

#### Acceptance Criteria

1. WHERE Amplify_Data is configured, WHEN a participant submits valid feedback, THE App SHALL save the new Feedback_Entry to Amplify_Data before resetting the Feedback_Form.
2. WHERE Amplify_Data is configured, WHEN the App loads, THE App SHALL display a loading indicator while fetching existing Feedback_Entry items from Amplify_Data.
3. WHERE Amplify_Data is configured and a save succeeds, THE App SHALL update Local_State with the saved Feedback_Entry and reset the Feedback_Form.
4. IF saving a Feedback_Entry to Amplify_Data fails, THEN THE App SHALL retain the current form field values, and SHALL display an error message near the Submit button indicating the save failed and prompting the participant to retry.
5. IF fetching Feedback_Entry items from Amplify_Data fails, THEN THE App SHALL display an error message indicating feedback could not be loaded, and SHALL display any Feedback_Entry items already present in Local_State.

---

### Requirement 7: Accessible and Beginner-Readable UI

**User Story:** As a workshop instructor, I want the UI to be clean, readable, and accessible, so that participants can focus on learning AWS Amplify rather than struggling with the interface.

#### Acceptance Criteria

1. THE App SHALL associate every form input (Name field, Comment textarea) with a visible `<label>` element using matching `for` and `id` attributes.
2. THE App SHALL provide an `aria-label` on each individual star button indicating its value (e.g., "Rate 3 out of 5"), so that screen readers can announce both the current selection and each option.
3. THE App SHALL render without horizontal scrollbars on a viewport width of 375 px or wider.
4. THE Feedback_Form SHALL display all validation error messages immediately below the field that failed on form submission, and each error element SHALL be linked to its input via `aria-describedby` so assistive technologies can associate the error with the correct field.
