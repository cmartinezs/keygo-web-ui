import { IconChevronLeft, IconChevronRight } from '@/shared/ui/icons'

interface PaginatorProps {
  /** Página actual (0-based) */
  currentPage: number
  /** Total de páginas */
  totalPages: number
  /** Total de elementos */
  totalElements: number
  /** Elementos por página */
  pageSize: number
  /** Callback al cambiar de página */
  onPageChange: (page: number) => void
  /** Desactivar el paginador */
  disabled?: boolean
  /** CSS adicionales */
  className?: string
}

export function Paginator({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  disabled = false,
  className = '',
}: PaginatorProps) {
  if (totalPages <= 1) return null

  const startItem = currentPage * pageSize + 1
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements)
  const isFirstPage = currentPage === 0
  const isLastPage = currentPage >= totalPages - 1

  return (
    <div className={`flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg ${className}`}>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Mostrando {startItem} a {endItem} de {totalElements}
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage || disabled}
          aria-label="Página anterior"
          className="inline-flex items-center justify-center w-8 h-8 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>

        <span className="text-sm text-slate-600 dark:text-slate-400 px-2">
          Página {currentPage + 1} de {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage || disabled}
          aria-label="Página siguiente"
          className="inline-flex items-center justify-center w-8 h-8 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
