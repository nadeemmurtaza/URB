/** Light/dark theme switch driven by data-theme on <html>. Theme names come from config (brand.theme). */
export function createTheme({ storage, light, dark, root = document.documentElement }) {
  const get = () => storage.get('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const apply = (mode) => { root.setAttribute('data-theme', mode === 'dark' ? dark : light); root.setAttribute('data-mode', mode) }
  apply(get())
  return { mode: get, set(mode) { storage.set('theme', mode); apply(mode) }, toggle() { this.set(get() === 'dark' ? 'light' : 'dark') } }
}
