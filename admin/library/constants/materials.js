/** Units and kinds for a materials master and bills of materials. Labels only: no currency or locale here. */
export const UNITS = [['g', 'g'], ['m', 'm'], ['pc', 'piece'], ['sheet', 'sheet'], ['ml', 'ml']]
export const MATERIAL_KINDS = [['yarn', 'Yarn'], ['wire', 'Wire & stems'], ['wrap', 'Wrapping paper'], ['ribbon', 'Ribbon'], ['filler', 'Stuffing'], ['packaging', 'Packaging'], ['hardware', 'Hardware'], ['other', 'Other']]
export const MATERIAL_STATE = { ok: { label: 'In stock', tone: 'success' }, low: { label: 'Low', tone: 'warning' }, out: { label: 'Out', tone: 'error' } }
export const MARGIN_STATE = { healthy: { label: 'Healthy', tone: 'success' }, thin: { label: 'Thin', tone: 'warning' }, loss: { label: 'Loss', tone: 'error' }, none: { label: 'No recipe', tone: 'neutral' } }
