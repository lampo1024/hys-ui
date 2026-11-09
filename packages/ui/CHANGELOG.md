# Changelog

## Unreleased

- Add bounded Gantt undo/redo for accepted scheduling and dependency edits, with atomic replay, scoped shortcuts and external-update safety.
- Add dependency-order and invalid-data diagnostics, cycle detection, paged conflict inspection and incident-only drag previews.

- Use one shared Gantt scroll viewport for task names and timelines, with pinned date headers and task labels; prevent clipped rows and blank space after vertical scrolling.
- Add Gantt viewport height controls and multi-task scrolling examples; preserve horizontal fitting and center bars within configurable row heights.
- Add optional Gantt virtual rows and task-location methods, with bounded rendering, cached-page scroll restoration and independent large-data examples.
- Add pointer and keyboard dependency editing, edge selection/removal, cycle and permission checks, edge auto-scrolling and accepted-change events.
- Add resizable Gantt task columns with controlled widths, bounds, responsive timeline space, keyboard adjustments, cancellation and reset.
- Route backward Gantt dependencies through the row gap and keep a visible approach segment outside the target bar.
- Allow dragging or keyboard retargeting existing dependency endpoints, with atomic moves, validation, cancellation and accepted-move events.
- Clear Gantt edge selection when interacting with the surrounding chart, retaining endpoint editing and removal actions.
- Disambiguate shared dependency endpoints with named relation choices, one active drag handle and focused edge highlighting.
- Support clearing task selection through empty-chart clicks, Escape or a null model, with layered editing cancellation and accessible pressed states.
- Add compact, translucent dependency choices with search, direct removal, predecessor/successor location and endpoint-edit actions.

- Expand Rating with precise fractional display, custom level colors/icons, score/text templates, controlled hover previews, keyboard/RTL and form/reset integration.
- Expand Segmented with typed/mapped options, custom content, vertical/block/rounded layouts, animated selection, keyboard navigation and cached-page observer cleanup.
- Remove obsolete Gantt scale-button styles and keep segmented labels readable on their selected surfaces across themes.
- Add independent rating and segmented scenarios, public instance types and interaction guidance.

- Expand checkboxes with scalar/array values, mapped checked values, uncontrolled defaults, button/border variants and form reset behavior.
- Add CheckboxGroup and standalone Radio; support mapped/typed options, composed children, selection limits and bulk actions, keyboard navigation and native form values.
- Expand Switch with mapped values, sizes, inline text/icons, custom rails/thumbs and cancellation-aware async guards; retain change-only consumers and discard stale completions.
- Add independent choice-control scenarios and verify existing tree, permission and transfer integrations.

- Add Autocomplete with free text input, grouped/local/remote suggestions, mapped business fields, custom matching and cancellable debounced queries.
- Support custom input/option/loading/header/footer/clear content, retryable errors, keyboard preview and selection policies, controlled state and form integration.
- Add dedicated autocomplete scenarios, public TypeScript interfaces and input/async/accessibility guidance.
- Keep the documentation table of contents fixed during page transitions and asynchronous example loading, with independent scrolling for long navigation lists.

- Expand Avatar with icon/text/image types, image fit modes and source attributes, fallback sources/slots, loading hooks, responsive sizes and auto-fit text with configurable gaps.
- Add AvatarGroup for data/slot composition, shared sizes/shapes, overlap and vertical layouts, collapsed members, keyboard-accessible overflow panels and cached-page cleanup.
- Add independent avatar/group scenarios, public types and API guidance.

- Prevent slider tooltip clipping with independent, themed overlays, viewport edge shifting/flipping, long-text wrapping and scroll/resize positioning cleanup.
- Move slider handles and selected tracks through transforms; cache stable tooltip styles and dimensions and update tip positions in the handle's paint cycle.

- Replace native range inputs with custom pointer-driven slider tracks and accessible handles, including decimal-safe steps, ordered intervals, track dragging and keyboard controls.
- Add marks-only selection, stops, vertical/reverse layouts, size inheritance, tooltip/handle/mark slots, optional numeric editors and named form values.
- Clean active pointer listeners and animation frames on cancellation and cached-page leave; add dedicated slider scenarios and public instance types.

- Expand text inputs with custom clear/password icons, icon props, formatting/parsing, uncontrolled defaults, controlled password visibility and held-password cleanup.
- Share Input textarea mode and standalone Textarea behavior, with bounded autosize, width/size remeasurement, native form values, composition-safe updates and public instance methods.
- Add UTF-16, grapheme and custom length strategies, safe truncation, inside/outside counters, custom count output and independent examples for each input capability.
- Prevent stale text from reappearing when an input clear and form reset occur in the same event.
- Use descriptive documentation scenario titles, improve composed select/input styles and isolate transient password preview behavior from published controls.

- Expand number inputs with nullable/uncontrolled values, clear policies, decimal-safe steps, bounded strict grids and exact string-mode values.
- Add display formatting/parsing, decimal separators, input filtering, synchronous validation and configurable draft/live updates.
- Add stacked right controls, affix/icon slots, loading states, keyboard policies, opt-in wheel adjustment and held-button stepping with cached-page cleanup.
- Preserve form feedback, native field submission and reset behavior; add public number types, instance methods and independent numeric scenarios.

- Expand select values to numbers, booleans and stable-key objects, with configurable empty/clear values, groups and business-field mappings.
- Add removable/collapsed tags, selection limits, created options, separator input, controlled open/search state and richer slots/events.
- Add cancellable/debounced remote methods with retry, bounded virtual lists, page navigation, typeahead and native form submission fields.
- Preserve wrapping-label activation, form feedback, theme and size inheritance; clean remote requests and popup observers on cached-page leave.
- Add independent select scenes and public type/keyboard/remote-search notes.

- Add shared automatic label alignment, responsive field columns, 24-column label/control layouts and inline forms.
- Add label suffixes, wrapping, optional markers, tooltip/help/extra content, inherited icons and inline feedback.
- Add snapshot reads, partial writes, server feedback arrays, configurable reset baselines, callback validation and imperative submit.
- Add per-field first-error policy, callback validators, transformed nested/member rules and conditional data preservation.
- Add accessible grouped controls, a public custom-control context hook and layout observer cleanup for cached pages.
- Add independent scenarios for complete forms, query filters, alignment, grids, numeric validation, policies, record hydration and accessibility.

- Add typed and nested form rules, warning-only feedback, field dependencies, partial validation/reset and structured results.
- Add field lookup/focus/scroll methods, initial-value capture, rule-change checks, label/feedback slots and inherited layout settings.
- Cancel stale form checks and submissions on reset, clear, disable and cached-page leave; provide AbortSignal to custom validators.
- Propagate form and field disabled/size settings to inputs, selectors, buttons and related controls, including teleported panels.
- Keep select option rows, search fields and icons aligned with the effective control size, including live changes while the popup is open.
- Add practical form scenarios for dynamic rows, nested values, cross-field checks, asynchronous cancellation and field methods.

- Expand tabs with placements, presentation styles, numeric values, dynamic actions, asynchronous guards, panel lifecycle options and overflow navigation.
- Add stable accordion keys, keyboard navigation, configurable trigger areas, panel lifecycle options, guarded expansion and extra content slots.
- Add per-step status, subtitles, custom content, compact/dot layouts and responsive keyboard navigation.
- Add breadcrumb label slots, per-item separators, disabled links and safe external-link attributes.
- Expand navigation examples and regression coverage for state preservation, rapid input, guard failures and cached-page cleanup.

## 0.1.1

- Center toast messages at the top by default and add seven placement options.
- Remove the toast accent border; add warning/loading states, content/icon/action slots and timer pause/resume.
- Add useHysToast for keyed updates, grouping, bounded queues, close handles and completion callbacks.
- Improve toast transitions, narrow-screen layout and cached-page resource cleanup.
- Add createHysToast for shared services outside component setup.
- Match drawer entrance/exit directions to placement, including fullscreen; support explicit top/bottom height.
- Fit Gantt timelines to the available container width and preserve date calculations while resizing.
- Keep select options on one line, size popups to content, and add exact-width and custom filtering options.
- Preserve remote selection labels and improve keyboard navigation, disabled options and composition handling.
- Unify checkbox/radio visuals and compose them in trees, transfer lists and permission matrices.
- Add permission batch selection and transfer change events; preserve drag/drop animations.
- Prevent stale asynchronous switch, upload and dialog actions after cancellation or page changes.
- Improve form validation for custom controls, field descriptions, readonly behavior and reset feedback.
- Correct slider step alignment, calendar initial selection, numeric animation boundaries and resize cleanup.
- Synchronize pagination models after page-size changes and validate typed jump targets immediately.
- Preserve typed numeric precision and expose draft input events from number inputs.
- Respect disabled notification actions; defer incomplete search composition and cancel stale queries.
- Reset command highlights after filtering, normalize organization input and tour step bounds, and enable default tour Escape behavior.
- Guard pending rich-text link commands and improve composite form focus and keyboard file selection.
- Expand select examples and organize configuration panels into aligned parameter and behavior groups.
- Add formatted, highlighted, lazy-loaded source panels with toolbar copy actions and responsive layout.
- Simplify documentation to focus on component features, API and examples.

## 0.1.0

- Introduce reusable Vue components with Hys-prefixed public names.
- Add isolated styles, six themes, reactive configuration and public TypeScript declarations.
- Expand common interaction capabilities across form, selection, feedback, navigation, layout and data components.
- Add rule-based forms, asynchronous validation, reset and accessible field feedback.
- Preserve custom calendars, color selection, virtualized data, drag/drop, filtering and cached-page cleanup.
- Add separate component documentation, runnable source examples, API metadata and release verification.
