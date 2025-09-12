'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
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

interface CommitteeNoComboboxComponentProps {
  value: string | undefined
  onChange: (value: string) => void
  fetchUrl: string
}

interface CommitteeNoResponse {
  committeeNoList: string[]
  count: number
}

export default function CommitteeNoComboboxComponent({
  value,
  onChange,
  fetchUrl,
}: CommitteeNoComboboxComponentProps) {
  const [open, setOpen] = useState(false)
  const [committeeNumbers, setCommitteeNumbers] = useState<string[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchCommitteeNumbers = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(fetchUrl)
        const data: CommitteeNoResponse = await res.json()
        
        // Handle the new response format
        setCommitteeNumbers(Array.isArray(data.committeeNoList) ? data.committeeNoList : [])
        setTotalCount(data.count || 0)
        
        console.log(`Loaded ${data.count} committee numbers`)
      } catch (err) {
        console.error('Failed to fetch committee numbers:', err)
        setCommitteeNumbers([])
        setTotalCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCommitteeNumbers()
  }, [fetchUrl])

  const filtered = useMemo(() => {
    return committeeNumbers.filter((committeeNo) =>
      committeeNo.toLowerCase().includes(query.toLowerCase())
    )
  }, [committeeNumbers, query])

  const handleSelect = (selected: string) => {
    onChange(selected === value ? '' : selected)
    setOpen(false)
    console.log("selected committee number:", selected)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between font-bold h-12"
          disabled={isLoading}
        >
          {isLoading ? 'جاري التحميل...' : (value || 'البحث عن رقم اللجنة')}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput
            placeholder="البحث عن رقم اللجنة..."
            value={query}
            onValueChange={setQuery}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'جاري التحميل...' : 'لا يوجد نتائج.'}
            </CommandEmpty>
            <CommandGroup>
              <div className="px-2 py-1 text-xs text-gray-500 border-b">
                {filtered.length} من أصل {totalCount} لجنة
              </div>
              {filtered.map((committeeNo) => (
                <CommandItem
                  key={committeeNo}
                  value={committeeNo}
                  onSelect={() => handleSelect(committeeNo)}
                  className="justify-between"
                >
                  {committeeNo}
                  <Check
                    className={cn(
                      'ml-2 h-4 w-4',
                      value === committeeNo ? 'opacity-100' : 'opacity-0'
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