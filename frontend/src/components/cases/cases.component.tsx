import React from 'react'
import styles from './cases.component.module.scss'
import { useCasesHooks }   from '../../hooks/useCases.hooks.ts'
import { SearchBar }       from '../ui/searchBar/searchBar.component.tsx'
import { PriceFilter }     from '../ui/priceFilter/priceFilter.component.tsx'
import { CategorySection } from './categorySection/categorySection.tsx'

const Cases: React.FC = () => {
    const {
        categories, suggestions, collapsed, toggleCategory,
        search, setSearch, priceFrom, setPriceFrom,
        priceTo, setPriceTo, dropOpen, setDropOpen,
        isFiltering, clearFilters, searchRef,
    } = useCasesHooks()

    // скрол к карточке кейса и подсвечивают на пару секунд
    const scrollToCase = (id: number) => {
        const el = document.getElementById(`case-card-${id}`)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el.classList.add(styles.case_card_highlight)
            setTimeout(() => el.classList.remove(styles.case_card_highlight), 1800)
        }
        setSearch('')
        setDropOpen(false)
    }

    return (
        <div className={styles.case_list}>

            <div className={styles.filters}>
                <SearchBar
                    search={search}
                    dropOpen={dropOpen}
                    suggestions={suggestions}
                    searchRef={searchRef}
                    onSearch={setSearch}
                    onDropOpen={setDropOpen}
                    onSelectCase={scrollToCase}
                />
                <PriceFilter
                    priceFrom={priceFrom}
                    priceTo={priceTo}
                    isFiltering={isFiltering}
                    onFromChange={setPriceFrom}
                    onToChange={setPriceTo}
                    onClear={clearFilters}
                />
            </div>

            {/* рендерю только категории в которых есть предметы */}
            {Object.entries(categories).map(([key, group]) =>
                    group.items.length > 0 && (
                        <CategorySection
                            key={key}
                            categoryKey={key}
                            title={group.title}
                            items={group.items}
                            collapsed={collapsed.includes(key)}
                            onToggle={() => toggleCategory(key)}
                        />
                    )
            )}
        </div>
    )
}

export default Cases