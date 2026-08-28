# Dead-Code and Refactoring Contract

Contract: **DC**, version **1.0**, status **ACTIVE**.

- **DC-001:** Every code WP examines its changed symbols and direct callers, templates, selectors, and configuration for orphaned or duplicated behavior. Report the search scope and findings even when none are found. Whole-repository cleanup belongs only to an assigned refactoring package.
- **DC-002:** Search both definitions and uses with repository-wide tools such as `rg`. Include HTML inline handlers, `window.app` exports, delegated `data-action` strings, dynamic imports, level configuration, CSS selectors, generated markup, and test fixtures. A zero static-reference count is a candidate, not proof of unreachability.
- **DC-003:** Classify each candidate as `PROVEN_ORPHAN`, `DYNAMICALLY_USED`, `DUPLICATE_BUT_LIVE`, or `UNCERTAIN`. Record symbol/path, searches, known entrypoints, evidence, removal risk, and disposition. Keep uncertain code and request review.
- **DC-004:** Remove only proven orphans created by the current change or explicitly authorized legacy targets. Never delete compatibility aliases, migrations, old IDs, or public hooks merely because the new UI no longer calls them locally.
- **DC-005:** Characterize behavior before extraction. Keep pure domain logic separate from platform effects; reuse shared semantics without coupling verb scheduling to ordinary-level grading. Avoid broad formatting, speculative abstractions, and dependency changes.
- **DC-006:** For removed handlers/styles, exercise their former and neighboring user paths on desktop/mobile. For removed modules/exports, verify importing entrypoints and browser startup. For persistence code, legacy-data tests are mandatory. No new broken import, console error, or dangling selector may remain.
- **DC-007:** Do not treat test coverage as proof of dead code: unexecuted can mean untested. Likewise, line-count reduction, search results, lint warnings, and green unit tests alone do not justify deletion.
- **DC-008:** Report surviving duplication and future cleanup separately. The acceptance criterion is preserved behavior plus demonstrated ownership improvement, not deleting as much code as possible.
