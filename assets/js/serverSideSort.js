// Intercept MOJ sortable-table click events to perform server-side sorting
// instead of the default client-side DOM reordering (which doesn't work with pagination)
document.querySelectorAll('table[data-module="moj-sortable-table"][data-sort-href-template]').forEach(table => {
  const hrefTemplate = table.getAttribute('data-sort-href-template')
  const thead = table.querySelector('thead')

  if (!thead) return

  thead.addEventListener(
    'click',
    event => {
      const button = event.target.closest('button')
      if (!button) return

      const th = button.closest('th[data-sort-key]')
      if (!th) return

      event.stopPropagation()
      event.preventDefault()

      const sortKey = th.getAttribute('data-sort-key')
      const currentSort = th.getAttribute('aria-sort')
      const nextDirection = currentSort === 'ascending' ? 'desc' : 'asc'

      window.location.href = hrefTemplate.replace('{sortKey}', sortKey).replace('{sortDirection}', nextDirection)
    },
    true,
  ) // capturing phase — fires before MOJ's bubbling listener
})
