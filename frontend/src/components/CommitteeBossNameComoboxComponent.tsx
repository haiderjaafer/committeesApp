'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface CommitteeTitleListResponse {
  committeeBossNameList: string[]
  count: number
}

interface CommitteeBossNameComoboxComponentProps {
  value: string | undefined
  onChange: (value: string) => void
  fetchUrl: string
}

export default function CommitteeBossNameComoboxComponent({
  value,
  onChange,
  fetchUrl,
}: CommitteeBossNameComoboxComponentProps) {
  const [open, setOpen] = useState(false)
  const [committeeBossName, setCommitteeBossName] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [totalCount, setTotalCount] = useState<number>(0)

  const filtered = useMemo(() => {
    return committeeBossName.filter((title) =>
      title.toLowerCase().includes(query.toLowerCase())
    )
  }, [committeeBossName, query])

  

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query)
    }, 400)

    return () => clearTimeout(handler)
  }, [query])

  // Fetch API
  useEffect(() => {
    const controller = new AbortController()

    const fetchCommittees = async () => {
      if (!debouncedQuery) {
        setCommitteeBossName([])
        setTotalCount(0)
        return
      }

      setIsLoading(true)
      try {
        const res = await fetch(
          `${fetchUrl}?search=${encodeURIComponent(debouncedQuery)}`,
          { signal: controller.signal }
        )

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

        const data: CommitteeTitleListResponse = await res.json()

        setCommitteeBossName(Array.isArray(data.committeeBossNameList) ? data.committeeBossNameList : [])
        setTotalCount(data.count || 0)
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to fetch committee titles:', err)
          setCommitteeBossName([])
          setTotalCount(0)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchCommittees()

    return () => controller.abort()
  }, [debouncedQuery, fetchUrl])

  const handleSelect = useCallback(
    (selected: string) => {
      onChange(selected === value ? '' : selected)
      setOpen(false)
    },
    [value, onChange]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between font-bold h-12"
        >
          {value || 'البحث عن اسم رئيس اللجنة'}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="البحث عن اسم رئيس اللجنة..."
            value={query}
            onValueChange={setQuery}
            className="h-9"
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              </div>
            )}
            <CommandEmpty>لا يوجد نتائج.</CommandEmpty>
            <CommandGroup>
              {committeeBossName.length > 0 && (
                <div className="px-2 py-1 text-xs text-gray-500 border-b">
                  {filtered.length} من أصل {totalCount} اسم
                </div>
              )}
              {filtered.map((name) => (
                <CommandItem
                  key={name}
                  value={name}
                  onSelect={() => handleSelect(name)}
                  className="justify-between"
                >
                  {name}
                  <Check
                    className={cn(
                      'ml-2 h-4 w-4',
                      value === name ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
