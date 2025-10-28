import { useState } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


interface PaginatedTabContentProps {
  items: any[];
  itemsPerPage: number;
  handleItemsPerPageChange: (value: string) => void;
  renderItem: (item: any) => React.ReactNode;
  emptyMessage?: string;
}

const PaginatedTabContent: React.FC<PaginatedTabContentProps> = ({ items, itemsPerPage, handleItemsPerPageChange, renderItem, emptyMessage = "No Items." }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const pagedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      {totalItems > 0 ? (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pagedItems.map(renderItem)}
            </div>

            <div className="mt-6 flex justify-between">
                <Pagination>
                    <PaginationContent className="flex gap-2">
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                aria-disabled={currentPage <= 1}
                                tabIndex={currentPage <= 1 ? -1 : undefined}
                                className={`
                                    px-4 py-2 rounded-lg font-medium transition
                                    ${currentPage <= 1 ? 'text-white/30 pointer-events-none' : 'text-white/70'}
                                    hover:bg-white/20 hover:text-white hover:scale-[1.02] hover:shadow-lg
                                `}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                                }}
                            >
                                Prev
                            </PaginationPrevious>
                        </PaginationItem>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                                <PaginationLink
                                href="#"
                                isActive={page === currentPage}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(page);
                                }}
                                className={`
                                    px-4 py-2 rounded-lg font-medium transition
                                    ${page === currentPage ? 'bg-white/10 text-white' : 'text-white/70'}
                                    hover:bg-white/20 hover:text-white hover:scale-[1.02] hover:shadow-lg
                                `}
                                >
                                {page}
                                </PaginationLink>
                            </PaginationItem>
                        ))}

                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                aria-disabled={currentPage >= totalPages}
                                tabIndex={currentPage >= totalPages ? -1 : undefined}
                                className={`
                                    px-4 py-2 rounded-lg font-medium transition
                                    ${currentPage >= totalPages ? 'text-white/30 pointer-events-none' : 'text-white/70'}
                                    hover:bg-white/20 hover:text-white hover:scale-[1.02] hover:shadow-lg
                                `}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                }}
                            >
                                Next
                            </PaginationNext>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>

                <div className="min-w-50 flex items-center justify-end space-x-2">
                    <span className="text-sm text-muted-foreground">Afficher par page:</span>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={handleItemsPerPageChange}
                    >
                        <SelectTrigger className="w-[80px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className='bg-[#0B1126] text-white/90'>
                            {[5,10,20,50].map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                                {n}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
            </div>
        </>
      ) : (
        <div className="text-xl italic">{emptyMessage}</div>
      )}
    </div>
  );
};

export default PaginatedTabContent;
