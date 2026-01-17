I will extract the duplicate "Import Modal" code into a reusable component.

1.  **Create New Component**: Create `src/components/home/sidebar/ImportConfigModal.vue`.
    *   It will accept `show` (boolean) and `value` (string) as props.
    *   It will emit `update:show`, `update:value`, and `confirm` events.
    *   It will contain the `<n-modal>` and `<n-card>` UI structure.

2.  **Refactor `ConsoleSidebar.vue`**:
    *   Import `ImportConfigModal`.
    *   Replace the inline `<n-modal>` block with `<ImportConfigModal v-model:show="showImportModal" v-model:value="importJson" @confirm="confirmImport" />`.

3.  **Refactor `ClassicSidebar.vue`**:
    *   Import `ImportConfigModal`.
    *   Replace the inline `<n-modal>` block with `<ImportConfigModal v-model:show="showImportModal" v-model:value="importJson" @confirm="confirmImport" />`.

This will reduce code duplication and make the modal reusable.