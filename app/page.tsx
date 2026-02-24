'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, LineChart, Line, Legend, Cell, PieChart, Pie, ScatterChart, Scatter,
  AreaChart, Area
} from 'recharts'
import {
  FiUpload, FiSend, FiArrowLeft, FiTrendingUp, FiTrendingDown, FiUsers,
  FiAward, FiAlertTriangle, FiMessageSquare, FiBarChart2, FiChevronDown,
  FiChevronUp, FiTarget, FiClock, FiStar, FiZap, FiX, FiCheckCircle,
  FiInfo, FiActivity, FiPercent, FiFilter, FiGrid, FiUser
} from 'react-icons/fi'
import { HiOutlineSparkles } from 'react-icons/hi2'
import { BsGraphUpArrow } from 'react-icons/bs'

// ---- TYPES ----

interface Employee {
  name: string
  empId: string
  doj: string
  month: string
  productivity: number
  quality: number
  attendance: number
  late: number
  totalPoints: number
  finalPoints: number
}

interface AgentTopPerformer {
  name?: string
  rank?: number
  final_points?: number
  highlight?: string
}

interface AgentBottomPerformer {
  name?: string
  rank?: number
  final_points?: number
  concern?: string
}

interface AgentAttendanceFlag {
  name?: string
  issue?: string
  attendance_score?: number
}

interface AgentTrend {
  metric?: string
  direction?: string
  detail?: string
}

interface AgentInsights {
  analysis_type?: string
  summary?: string
  top_performers?: AgentTopPerformer[]
  bottom_performers?: AgentBottomPerformer[]
  attendance_flags?: AgentAttendanceFlag[]
  trends?: AgentTrend[]
  recommendations?: string[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  data?: AgentInsights
}

type SortField = 'rank' | 'name' | 'productivity' | 'quality' | 'attendance' | 'late' | 'totalPoints' | 'finalPoints'
type SortDir = 'asc' | 'desc'

// ---- CONSTANTS ----

const AGENT_ID = '699dff055c317630d49ab03c'

const CHART_COLORS = [
  'hsl(27, 61%, 35%)',
  'hsl(36, 60%, 31%)',
  'hsl(30, 50%, 40%)',
  'hsl(20, 45%, 45%)',
  'hsl(15, 55%, 38%)',
  'hsl(40, 50%, 35%)',
  'hsl(25, 55%, 42%)',
  'hsl(35, 45%, 38%)',
  'hsl(18, 60%, 30%)',
  'hsl(28, 50%, 45%)',
]

const RANK_COLORS: Record<number, string> = {
  1: '#C5A054',
  2: '#A0A0A0',
  3: '#CD7F32',
}

const SAMPLE_DATA: Employee[] = [
  { name: 'Ananya Sharma', empId: 'EMP001', doj: '2022-01-15', month: 'January', productivity: 95, quality: 92, attendance: 98, late: 1, totalPoints: 285, finalPoints: 94 },
  { name: 'Rajesh Kumar', empId: 'EMP002', doj: '2021-06-20', month: 'January', productivity: 88, quality: 90, attendance: 95, late: 2, totalPoints: 273, finalPoints: 89 },
  { name: 'Priya Patel', empId: 'EMP003', doj: '2023-03-10', month: 'January', productivity: 92, quality: 88, attendance: 100, late: 0, totalPoints: 280, finalPoints: 92 },
  { name: 'Vikram Singh', empId: 'EMP004', doj: '2020-11-05', month: 'January', productivity: 78, quality: 82, attendance: 88, late: 5, totalPoints: 248, finalPoints: 76 },
  { name: 'Meera Reddy', empId: 'EMP005', doj: '2022-08-25', month: 'January', productivity: 91, quality: 94, attendance: 96, late: 1, totalPoints: 281, finalPoints: 93 },
  { name: 'Arjun Nair', empId: 'EMP006', doj: '2021-02-14', month: 'January', productivity: 85, quality: 86, attendance: 92, late: 3, totalPoints: 263, finalPoints: 85 },
  { name: 'Deepika Joshi', empId: 'EMP007', doj: '2023-07-01', month: 'January', productivity: 82, quality: 80, attendance: 90, late: 4, totalPoints: 252, finalPoints: 79 },
  { name: 'Karthik Iyer', empId: 'EMP008', doj: '2022-04-18', month: 'January', productivity: 90, quality: 91, attendance: 97, late: 1, totalPoints: 278, finalPoints: 91 },
  { name: 'Sneha Gupta', empId: 'EMP009', doj: '2021-09-30', month: 'January', productivity: 75, quality: 78, attendance: 85, late: 6, totalPoints: 238, finalPoints: 72 },
  { name: 'Rohit Verma', empId: 'EMP010', doj: '2020-05-12', month: 'January', productivity: 87, quality: 85, attendance: 93, late: 2, totalPoints: 265, finalPoints: 86 },
  { name: 'Ananya Sharma', empId: 'EMP001', doj: '2022-01-15', month: 'February', productivity: 93, quality: 94, attendance: 97, late: 1, totalPoints: 284, finalPoints: 93 },
  { name: 'Rajesh Kumar', empId: 'EMP002', doj: '2021-06-20', month: 'February', productivity: 90, quality: 88, attendance: 96, late: 2, totalPoints: 274, finalPoints: 90 },
  { name: 'Priya Patel', empId: 'EMP003', doj: '2023-03-10', month: 'February', productivity: 94, quality: 90, attendance: 99, late: 0, totalPoints: 283, finalPoints: 93 },
  { name: 'Vikram Singh', empId: 'EMP004', doj: '2020-11-05', month: 'February', productivity: 80, quality: 84, attendance: 90, late: 4, totalPoints: 254, finalPoints: 79 },
  { name: 'Meera Reddy', empId: 'EMP005', doj: '2022-08-25', month: 'February', productivity: 93, quality: 95, attendance: 98, late: 0, totalPoints: 286, finalPoints: 95 },
]

const SUGGESTED_QUESTIONS = [
  'Who improved the most?',
  'Any attendance issues?',
  'Compare top 2 performers',
  'Team strengths and weaknesses?',
  'Who needs coaching?',
]

// ---- HELPERS ----

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function parseCSV(text: string): Employee[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  const delimiter = lines[0].includes('\t') ? '\t' : ','
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/[^a-z0-9 ]/g, ''))

  const colMap: Record<string, number> = {}
  headers.forEach((h, i) => {
    if (h.includes('employee') && h.includes('name')) colMap.name = i
    else if (h === 'name' && colMap.name === undefined) colMap.name = i
    else if (h.includes('emp') && h.includes('id')) colMap.empId = i
    else if (h === 'doj' || h.includes('date of') || h.includes('joining')) colMap.doj = i
    else if (h === 'month') colMap.month = i
    else if (h.includes('productivity')) colMap.productivity = i
    else if (h.includes('quality')) colMap.quality = i
    else if (h.includes('attendance')) colMap.attendance = i
    else if (h.includes('late')) colMap.late = i
    else if (h.includes('final') && h.includes('point')) colMap.finalPoints = i
    else if (h.includes('total') && h.includes('point')) colMap.totalPoints = i
  })

  const employees: Employee[] = []
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i], delimiter)
    if (vals.length < 3) continue

    const get = (key: string, fallback: string = '') => {
      const idx = colMap[key]
      return idx !== undefined && idx < vals.length ? vals[idx].trim() : fallback
    }
    const getNum = (key: string, fallback: number = 0) => {
      const v = get(key, '')
      const n = parseFloat(v)
      return isNaN(n) ? fallback : n
    }

    employees.push({
      name: get('name', `Employee ${i}`),
      empId: get('empId', `EMP${String(i).padStart(3, '0')}`),
      doj: get('doj', ''),
      month: get('month', ''),
      productivity: getNum('productivity'),
      quality: getNum('quality'),
      attendance: getNum('attendance'),
      late: getNum('late'),
      totalPoints: getNum('totalPoints'),
      finalPoints: getNum('finalPoints'),
    })
  }

  return employees
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function avg(arr: number[]): number {
  if (!arr.length) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

// ---- ERROR BOUNDARY ----

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ---- RECHARTS CUSTOM TOOLTIP ----

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
      <p className="text-foreground font-semibold text-sm mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-muted-foreground text-xs">
          {entry.name}: <span className="text-foreground font-medium">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</span>
        </p>
      ))}
    </div>
  )
}

function CustomScatterTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0]?.payload
  if (!data) return null
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
      <p className="text-foreground font-semibold text-sm mb-1">{data?.name ?? 'Employee'}</p>
      <p className="text-muted-foreground text-xs">Productivity: <span className="text-foreground font-medium">{data?.productivity ?? 0}</span></p>
      <p className="text-muted-foreground text-xs">Quality: <span className="text-foreground font-medium">{data?.quality ?? 0}</span></p>
      <p className="text-muted-foreground text-xs">Final: <span className="text-foreground font-medium">{data?.finalPoints ?? 0}</span></p>
    </div>
  )
}

// ---- GAUGE RING (Power BI-style donut gauge) ----

function GaugeRing({ value, max, color, label, size = 110 }: { value: number; max: number; color: string; label: string; size?: number }) {
  const percentage = Math.min((value / max) * 100, 100)
  const data = [
    { name: 'filled', value: percentage },
    { name: 'empty', value: 100 - percentage },
  ]
  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius="70%" outerRadius="90%" startAngle={90} endAngle={-270} dataKey="value" stroke="none">
              <Cell fill={color} />
              <Cell fill="hsl(20, 18%, 12%)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-foreground font-serif">{typeof value === 'number' ? value.toFixed(1) : value}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground tracking-wider uppercase text-center leading-tight">{label}</span>
    </div>
  )
}

// ---- RANK BADGE ----

function RankBadge({ rank }: { rank: number }) {
  const color = RANK_COLORS[rank]
  if (color) {
    return (
      <div className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold" style={{ backgroundColor: color, color: '#1a1008' }}>
        {rank}
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-muted-foreground text-xs font-medium">
      {rank}
    </div>
  )
}

// ---- INSIGHT CARD ----

function InsightCard({ icon, title, children, color }: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  color?: string
}) {
  return (
    <Card className="bg-card border border-border shadow-lg shadow-black/10">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: color || 'hsl(36, 60%, 31%)', opacity: 0.2 }}>
            <span style={{ color: color || 'hsl(36, 60%, 31%)' }}>{icon}</span>
          </div>
          <CardTitle className="text-sm font-serif font-semibold text-foreground">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">{children}</CardContent>
    </Card>
  )
}

// ---- POWER BI TILE HEADER ----

function TileHeader({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-3 pb-2">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-[10px] tracking-wider uppercase text-muted-foreground font-sans font-medium">{title}</span>
    </div>
  )
}

// ---- CONDITIONAL COLOR HELPER ----

function kpiColor(value: number): string {
  if (value >= 90) return 'hsl(142, 40%, 35%)'
  if (value >= 80) return 'hsl(36, 60%, 31%)'
  return 'hsl(0, 63%, 31%)'
}

function kpiColorClass(value: number): string {
  if (value >= 90) return 'text-green-400'
  if (value >= 80) return 'text-amber-400'
  return 'text-red-400'
}

// ---- CUSTOM PIE LABEL ----

function renderCustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, value }: any) {
  if (value === 0) return null
  const RADIAN = Math.PI / 180
  const radius = outerRadius + 20
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="hsl(35, 15%, 55%)" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10}>
      {name} ({value})
    </text>
  )
}

// ---- MAIN PAGE ----

export default function Page() {
  // Data state
  const [employees, setEmployees] = useState<Employee[]>([])
  const [sampleMode, setSampleMode] = useState(false)
  const [fileError, setFileError] = useState('')
  const [isParsingFile, setIsParsingFile] = useState(false)

  // View state
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [insightsOpen, setInsightsOpen] = useState(false)

  // Filter & sort
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [sortField, setSortField] = useState<SortField>('finalPoints')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Agent state
  const [insights, setInsights] = useState<AgentInsights | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Active data source
  const activeData = sampleMode && employees.length === 0 ? SAMPLE_DATA : employees

  // Derive months
  const months = useMemo(() => {
    const ms = new Set<string>()
    activeData.forEach(e => { if (e.month) ms.add(e.month) })
    return Array.from(ms)
  }, [activeData])

  // Filter data
  const filteredData = useMemo(() => {
    if (selectedMonth === 'all') return activeData
    return activeData.filter(e => e.month === selectedMonth)
  }, [activeData, selectedMonth])

  // Aggregate by employee (latest or selected month)
  const aggregatedEmployees = useMemo(() => {
    const map = new Map<string, Employee>()
    filteredData.forEach(e => {
      const existing = map.get(e.name)
      if (!existing || e.finalPoints > existing.finalPoints) {
        map.set(e.name, e)
      }
    })
    return Array.from(map.values())
  }, [filteredData])

  // Sort
  const sortedEmployees = useMemo(() => {
    const arr = [...aggregatedEmployees]
    arr.sort((a, b) => {
      let av: any = a[sortField]
      let bv: any = b[sortField]
      if (sortField === 'name') {
        av = String(av).toLowerCase()
        bv = String(bv).toLowerCase()
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      if (sortField === 'rank') return 0
      return sortDir === 'asc' ? (av - bv) : (bv - av)
    })
    return arr
  }, [aggregatedEmployees, sortField, sortDir])

  // KPI stats
  const stats = useMemo(() => {
    const d = aggregatedEmployees
    if (!d.length) return { avgProd: 0, avgQual: 0, avgAtt: 0, teamSize: 0, avgFinal: 0 }
    return {
      avgProd: avg(d.map(e => e.productivity)),
      avgQual: avg(d.map(e => e.quality)),
      avgAtt: avg(d.map(e => e.attendance)),
      teamSize: d.length,
      avgFinal: avg(d.map(e => e.finalPoints)),
    }
  }, [aggregatedEmployees])

  // Chart data: top 10
  const top10ChartData = useMemo(() => {
    const sorted = [...aggregatedEmployees].sort((a, b) => b.finalPoints - a.finalPoints).slice(0, 10)
    return sorted.map(e => ({ name: e.name.split(' ')[0], fullName: e.name, finalPoints: e.finalPoints }))
  }, [aggregatedEmployees])

  // Chart data: grouped bar - all KPIs by employee
  const groupedBarData = useMemo(() => {
    const sorted = [...aggregatedEmployees].sort((a, b) => b.finalPoints - a.finalPoints).slice(0, 12)
    return sorted.map(e => ({
      name: e.name.split(' ')[0],
      fullName: e.name,
      productivity: e.productivity,
      quality: e.quality,
      attendance: e.attendance,
    }))
  }, [aggregatedEmployees])

  // Chart data: performance tier donut
  const performanceTiers = useMemo(() => {
    return [
      { name: 'Excellent (90+)', value: aggregatedEmployees.filter(e => e.finalPoints >= 90).length, color: 'hsl(142, 40%, 35%)' },
      { name: 'Good (80-89)', value: aggregatedEmployees.filter(e => e.finalPoints >= 80 && e.finalPoints < 90).length, color: 'hsl(36, 60%, 31%)' },
      { name: 'Average (70-79)', value: aggregatedEmployees.filter(e => e.finalPoints >= 70 && e.finalPoints < 80).length, color: 'hsl(27, 61%, 35%)' },
      { name: 'Below Avg (<70)', value: aggregatedEmployees.filter(e => e.finalPoints < 70).length, color: 'hsl(0, 63%, 31%)' },
    ]
  }, [aggregatedEmployees])

  // Chart data: scatter plot (productivity vs quality)
  const scatterData = useMemo(() => {
    return aggregatedEmployees.map(e => ({
      name: e.name,
      productivity: e.productivity,
      quality: e.quality,
      finalPoints: e.finalPoints,
    }))
  }, [aggregatedEmployees])

  // Chart data: late arrivals horizontal bar
  const lateArrivalsData = useMemo(() => {
    return [...aggregatedEmployees]
      .filter(e => e.late > 0)
      .sort((a, b) => b.late - a.late)
      .slice(0, 10)
      .map(e => ({
        name: e.name.split(' ')[0],
        fullName: e.name,
        late: e.late,
      }))
  }, [aggregatedEmployees])

  // Chart data: area chart - team averages over months
  const monthlyTrendData = useMemo(() => {
    const monthMap = new Map<string, Employee[]>()
    activeData.forEach(e => {
      if (!e.month) return
      const arr = monthMap.get(e.month) || []
      arr.push(e)
      monthMap.set(e.month, arr)
    })
    return Array.from(monthMap.entries()).map(([month, emps]) => ({
      month,
      productivity: avg(emps.map(e => e.productivity)),
      quality: avg(emps.map(e => e.quality)),
      attendance: avg(emps.map(e => e.attendance)),
      finalPoints: avg(emps.map(e => e.finalPoints)),
    }))
  }, [activeData])

  // Chart data: attendance distribution
  const attendanceChartData = useMemo(() => {
    const buckets = [
      { range: '< 80%', min: 0, max: 80, count: 0 },
      { range: '80-85%', min: 80, max: 85, count: 0 },
      { range: '85-90%', min: 85, max: 90, count: 0 },
      { range: '90-95%', min: 90, max: 95, count: 0 },
      { range: '95-100%', min: 95, max: 101, count: 0 },
    ]
    aggregatedEmployees.forEach(e => {
      for (const b of buckets) {
        if (e.attendance >= b.min && e.attendance < b.max) {
          b.count++
          break
        }
      }
    })
    return buckets
  }, [aggregatedEmployees])

  // Individual employee data
  const selectedEmpData = useMemo(() => {
    if (!selectedEmployee) return null
    const empRecords = activeData.filter(e => e.name === selectedEmployee)
    if (empRecords.length === 0) return null
    const latest = empRecords.reduce((a, b) => a.finalPoints >= b.finalPoints ? a : b)
    const rank = sortedEmployees.findIndex(e => e.name === selectedEmployee) + 1
    return { ...latest, rank, allRecords: empRecords }
  }, [selectedEmployee, activeData, sortedEmployees])

  // Radar data for individual
  const radarData = useMemo(() => {
    if (!selectedEmpData) return []
    return [
      { subject: 'Productivity', value: selectedEmpData.productivity, fullMark: 100 },
      { subject: 'Quality', value: selectedEmpData.quality, fullMark: 100 },
      { subject: 'Attendance', value: selectedEmpData.attendance, fullMark: 100 },
      { subject: 'Punctuality', value: Math.max(0, 100 - selectedEmpData.late * 10), fullMark: 100 },
    ]
  }, [selectedEmpData])

  // Line data for individual trend
  const trendData = useMemo(() => {
    if (!selectedEmpData) return []
    return selectedEmpData.allRecords.map(r => ({
      month: r.month || 'N/A',
      finalPoints: r.finalPoints,
      productivity: r.productivity,
      quality: r.quality,
    }))
  }, [selectedEmpData])

  // Employee comparison data for individual view
  const empCompareData = useMemo(() => {
    if (!selectedEmpData) return []
    return [
      { metric: 'Productivity', employee: selectedEmpData.productivity, teamAvg: stats.avgProd },
      { metric: 'Quality', employee: selectedEmpData.quality, teamAvg: stats.avgQual },
      { metric: 'Attendance', employee: selectedEmpData.attendance, teamAvg: stats.avgAtt },
      { metric: 'Final Score', employee: selectedEmpData.finalPoints, teamAvg: stats.avgFinal },
    ]
  }, [selectedEmpData, stats])

  // Rank percentile donut for individual view
  const rankPercentileData = useMemo(() => {
    if (!selectedEmpData || sortedEmployees.length === 0) return []
    const percentile = Math.round(((sortedEmployees.length - selectedEmpData.rank) / sortedEmployees.length) * 100)
    return [
      { name: 'rank', value: percentile },
      { name: 'rest', value: 100 - percentile },
    ]
  }, [selectedEmpData, sortedEmployees])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // File upload handler
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileError('')
    setIsParsingFile(true)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        const parsed = parseCSV(text)
        if (parsed.length === 0) {
          setFileError('No valid data rows found. Please check your CSV format.')
        } else {
          setEmployees(parsed)
          setSampleMode(false)
          setSelectedMonth('all')
          setInsights(null)
          setChatMessages([])
        }
      } catch (err) {
        setFileError('Failed to parse file. Please upload a valid CSV.')
      }
      setIsParsingFile(false)
    }
    reader.onerror = () => {
      setFileError('Failed to read file.')
      setIsParsingFile(false)
    }
    reader.readAsText(file)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // Build data context for agent
  const buildDataContext = useCallback(() => {
    const data = sampleMode && employees.length === 0 ? SAMPLE_DATA : employees
    if (!data.length) return ''
    return data.map(e =>
      `${e.name} (${e.empId}) | Month: ${e.month} | Productivity: ${e.productivity} | Quality: ${e.quality} | Attendance: ${e.attendance} | Late: ${e.late} | Total: ${e.totalPoints} | Final: ${e.finalPoints}`
    ).join('\n')
  }, [employees, sampleMode])

  // Generate insights
  const handleGenerateInsights = useCallback(async () => {
    const dataContext = buildDataContext()
    if (!dataContext) return

    setInsightsLoading(true)
    setInsightsError('')
    setActiveAgentId(AGENT_ID)
    setInsightsOpen(true)

    try {
      const message = `Analyze this team's KPI data and provide comprehensive insights including top/bottom performers, attendance flags, trends, and recommendations:\n\n${dataContext}`
      const result = await callAIAgent(message, AGENT_ID)

      if (result.success) {
        const agentData = result?.response?.result as AgentInsights | undefined
        const parsed: AgentInsights = {
          analysis_type: agentData?.analysis_type ?? 'general',
          summary: agentData?.summary ?? result?.response?.message ?? '',
          top_performers: Array.isArray(agentData?.top_performers) ? agentData.top_performers : [],
          bottom_performers: Array.isArray(agentData?.bottom_performers) ? agentData.bottom_performers : [],
          attendance_flags: Array.isArray(agentData?.attendance_flags) ? agentData.attendance_flags : [],
          trends: Array.isArray(agentData?.trends) ? agentData.trends : [],
          recommendations: Array.isArray(agentData?.recommendations) ? agentData.recommendations : [],
        }
        setInsights(parsed)
        setChatMessages([{ role: 'assistant', content: parsed.summary || 'Analysis complete. Here are the insights.', data: parsed }])
      } else {
        setInsightsError(result?.error || 'Failed to generate insights. Please try again.')
      }
    } catch (err) {
      setInsightsError('Network error. Please try again.')
    }

    setInsightsLoading(false)
    setActiveAgentId(null)
  }, [buildDataContext])

  // Chat handler
  const handleChatSend = useCallback(async () => {
    const q = chatInput.trim()
    if (!q) return

    const dataContext = buildDataContext()
    setChatMessages(prev => [...prev, { role: 'user', content: q }])
    setChatInput('')
    setChatLoading(true)
    setActiveAgentId(AGENT_ID)

    try {
      const message = dataContext
        ? `Based on this KPI data:\n${dataContext}\n\nQuestion: ${q}`
        : q
      const result = await callAIAgent(message, AGENT_ID)

      if (result.success) {
        const agentData = result?.response?.result as AgentInsights | undefined
        const summary = agentData?.summary ?? result?.response?.message ?? 'I could not generate a response.'
        setChatMessages(prev => [...prev, { role: 'assistant', content: summary, data: agentData ?? undefined }])
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: result?.error || 'Failed to get response.' }])
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please try again.' }])
    }

    setChatLoading(false)
    setActiveAgentId(null)
  }, [chatInput, buildDataContext])

  // Sort handler
  const handleSort = useCallback((field: SortField) => {
    if (field === 'rank') return
    setSortField(prev => {
      if (prev === field) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        return prev
      }
      setSortDir('desc')
      return field
    })
  }, [])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <FiChevronDown className="w-3 h-3 opacity-30" />
    return sortDir === 'asc' ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />
  }

  const hasData = activeData.length > 0

  // ---- INDIVIDUAL EMPLOYEE VIEW ----
  if (selectedEmployee && selectedEmpData) {
    const empPercentile = sortedEmployees.length > 0
      ? Math.round(((sortedEmployees.length - selectedEmpData.rank) / sortedEmployees.length) * 100)
      : 0

    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-background text-foreground">
          {/* Compact header bar */}
          <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-40">
            <div className="px-4 py-2.5 flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEmployee(null)}
                className="text-muted-foreground hover:text-foreground h-8"
              >
                <FiArrowLeft className="w-4 h-4 mr-1.5" />
                Dashboard
              </Button>
              <Separator orientation="vertical" className="h-5" />
              <div className="flex items-center gap-2 flex-1">
                <RankBadge rank={selectedEmpData.rank} />
                <div>
                  <h1 className="text-sm font-serif font-bold text-foreground leading-tight">{selectedEmpData.name}</h1>
                  <p className="text-[10px] text-muted-foreground">{selectedEmpData.empId} | Joined: {selectedEmpData.doj || 'N/A'}</p>
                </div>
              </div>
              <Badge variant="outline" className="border-border text-foreground text-xs bg-secondary/50">
                Final: {selectedEmpData.finalPoints}
              </Badge>
              <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                Rank #{selectedEmpData.rank} of {sortedEmployees.length}
              </Badge>
            </div>
          </header>

          <div className="p-4 space-y-3">
            {/* Row 1: Gauge rings + Rank Percentile */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Card className="bg-card border border-border/50 shadow-md shadow-black/5 flex items-center justify-center py-4">
                <GaugeRing value={selectedEmpData.productivity} max={100} color="hsl(27, 61%, 35%)" label="Productivity" />
              </Card>
              <Card className="bg-card border border-border/50 shadow-md shadow-black/5 flex items-center justify-center py-4">
                <GaugeRing value={selectedEmpData.quality} max={100} color="hsl(36, 60%, 31%)" label="Quality" />
              </Card>
              <Card className="bg-card border border-border/50 shadow-md shadow-black/5 flex items-center justify-center py-4">
                <GaugeRing value={selectedEmpData.attendance} max={100} color="hsl(30, 50%, 40%)" label="Attendance" />
              </Card>
              <Card className="bg-card border border-border/50 shadow-md shadow-black/5 flex items-center justify-center py-4">
                <GaugeRing value={Math.max(0, 100 - selectedEmpData.late * 10)} max={100} color="hsl(20, 45%, 45%)" label="Punctuality" />
              </Card>
              <Card className="bg-card border border-border/50 shadow-md shadow-black/5 flex items-center justify-center py-4">
                <div className="flex flex-col items-center gap-1">
                  <div style={{ width: 110, height: 110 }} className="relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={rankPercentileData} cx="50%" cy="50%" innerRadius="70%" outerRadius="90%" startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                          <Cell fill="#C5A054" />
                          <Cell fill="hsl(20, 18%, 12%)" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-foreground font-serif">{empPercentile}%</span>
                      <span className="text-[8px] text-muted-foreground">ile</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground tracking-wider uppercase text-center leading-tight">Rank Percentile</span>
                </div>
              </Card>
            </div>

            {/* Row 2: Comparison Bar + Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
              <Card className="lg:col-span-3 bg-card border border-border/50 shadow-md shadow-black/5">
                <TileHeader title="Employee vs Team Average" icon={<BsGraphUpArrow className="w-3 h-3" />} />
                <CardContent className="pt-0 pb-3 px-3">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={empCompareData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(20, 18%, 16%)" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 10 }} stroke="hsl(20, 18%, 16%)" />
                      <YAxis type="category" dataKey="metric" tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 11 }} stroke="hsl(20, 18%, 16%)" width={70} />
                      <RechartsTooltip content={<CustomBarTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 10, color: 'hsl(35, 15%, 55%)' }} />
                      <Bar dataKey="employee" name="Employee" fill="hsl(27, 61%, 35%)" radius={[0, 3, 3, 0]} barSize={14} />
                      <Bar dataKey="teamAvg" name="Team Avg" fill="hsl(20, 18%, 25%)" radius={[0, 3, 3, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-card border border-border/50 shadow-md shadow-black/5">
                <TileHeader title="KPI Distribution" icon={<FiTarget className="w-3 h-3" />} />
                <CardContent className="pt-0 pb-3 px-3">
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(20, 18%, 20%)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 9 }} />
                      <Radar name="Score" dataKey="value" stroke="hsl(36, 60%, 31%)" fill="hsl(36, 60%, 31%)" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Row 3: Trend line + Monthly breakdown table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Card className="bg-card border border-border/50 shadow-md shadow-black/5">
                <TileHeader title="Performance Trend" icon={<FiTrendingUp className="w-3 h-3" />} />
                <CardContent className="pt-0 pb-3 px-3">
                  {trendData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(20, 18%, 16%)" />
                        <XAxis dataKey="month" tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 11 }} stroke="hsl(20, 18%, 16%)" />
                        <YAxis tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 11 }} stroke="hsl(20, 18%, 16%)" />
                        <RechartsTooltip content={<CustomBarTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 10, color: 'hsl(35, 15%, 55%)' }} />
                        <Line type="monotone" dataKey="finalPoints" name="Final Points" stroke="hsl(36, 60%, 31%)" strokeWidth={2} dot={{ fill: 'hsl(36, 60%, 31%)', r: 3 }} />
                        <Line type="monotone" dataKey="productivity" name="Productivity" stroke="hsl(27, 61%, 35%)" strokeWidth={2} dot={{ fill: 'hsl(27, 61%, 35%)', r: 3 }} />
                        <Line type="monotone" dataKey="quality" name="Quality" stroke="hsl(30, 50%, 40%)" strokeWidth={2} dot={{ fill: 'hsl(30, 50%, 40%)', r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
                      <p>Single month data. Upload multi-month data for trends.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border border-border/50 shadow-md shadow-black/5">
                <TileHeader title="Monthly Breakdown" icon={<FiGrid className="w-3 h-3" />} />
                <CardContent className="pt-0 pb-3 px-3">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground text-[10px] tracking-wider uppercase py-2">Month</TableHead>
                          <TableHead className="text-muted-foreground text-[10px] tracking-wider uppercase text-right py-2">Prod</TableHead>
                          <TableHead className="text-muted-foreground text-[10px] tracking-wider uppercase text-right py-2">Qual</TableHead>
                          <TableHead className="text-muted-foreground text-[10px] tracking-wider uppercase text-right py-2">Att</TableHead>
                          <TableHead className="text-muted-foreground text-[10px] tracking-wider uppercase text-right py-2">Late</TableHead>
                          <TableHead className="text-muted-foreground text-[10px] tracking-wider uppercase text-right py-2">Final</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEmpData.allRecords.map((r, idx) => (
                          <TableRow key={idx} className={cn('border-border hover:bg-secondary/30', idx % 2 === 0 ? 'bg-secondary/10' : '')}>
                            <TableCell className="text-xs font-medium text-foreground py-2">{r.month || 'N/A'}</TableCell>
                            <TableCell className={cn('text-xs text-right py-2', kpiColorClass(r.productivity))}>{r.productivity}</TableCell>
                            <TableCell className={cn('text-xs text-right py-2', kpiColorClass(r.quality))}>{r.quality}</TableCell>
                            <TableCell className={cn('text-xs text-right py-2', kpiColorClass(r.attendance))}>{r.attendance}</TableCell>
                            <TableCell className={cn('text-xs text-right py-2', r.late > 3 ? 'text-red-400' : 'text-foreground')}>{r.late}</TableCell>
                            <TableCell className="text-xs text-right font-semibold text-foreground py-2">{r.finalPoints}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  // ---- MAIN DASHBOARD VIEW ----
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        {/* Power BI Header Ribbon */}
        <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-40">
          <div className="px-4 py-2.5 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-secondary">
                <FiBarChart2 className="w-4 h-4" style={{ color: 'hsl(36, 60%, 31%)' }} />
              </div>
              <div>
                <h1 className="text-sm font-serif font-bold text-foreground tracking-wide leading-tight">KPI Performance Dashboard</h1>
                <p className="text-[10px] text-muted-foreground">Team analytics and AI-powered insights</p>
              </div>
            </div>

            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            {/* Month filter */}
            {hasData && (
              <div className="flex items-center gap-1.5">
                <FiFilter className="w-3 h-3 text-muted-foreground" />
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[130px] h-8 bg-secondary/50 border-border text-foreground text-xs">
                    <SelectValue placeholder="All Months" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">All Months</SelectItem>
                    {months.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {/* Sample Data Toggle */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground tracking-wide uppercase">Sample</span>
                <Switch
                  checked={sampleMode}
                  onCheckedChange={(checked) => {
                    setSampleMode(checked)
                    if (checked && employees.length === 0) {
                      setSelectedMonth('all')
                    }
                  }}
                />
              </div>

              <Separator orientation="vertical" className="h-5 hidden sm:block" />

              <Button
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-secondary h-8 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <FiUpload className="w-3.5 h-3.5 mr-1.5" />
                Upload
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              <Button
                size="sm"
                onClick={handleGenerateInsights}
                disabled={!hasData || insightsLoading}
                className="bg-accent text-accent-foreground hover:bg-accent/80 h-8 text-xs"
              >
                {insightsLoading ? (
                  <>
                    <FiActivity className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  <>
                    <HiOutlineSparkles className="w-3.5 h-3.5 mr-1.5" />
                    AI Insights
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* File error */}
        {fileError && (
          <div className="px-4 mt-2">
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-2 flex items-center gap-2 text-xs text-destructive">
              <FiAlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {fileError}
              <button onClick={() => setFileError('')} className="ml-auto">
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Parsing skeleton */}
        {isParsingFile && (
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-[160px] rounded-lg bg-muted" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-lg bg-muted" />
          </div>
        )}

        {/* Empty state */}
        {!hasData && !isParsingFile && (
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 60px)' }}>
            <div className="p-6 rounded-xl bg-card border border-border shadow-lg shadow-black/10 max-w-md w-full mx-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
                <FiUpload className="w-6 h-6" style={{ color: 'hsl(36, 60%, 31%)' }} />
              </div>
              <h2 className="text-base font-serif font-bold text-foreground mb-2 text-center">Upload KPI data to begin</h2>
              <p className="text-xs text-muted-foreground mb-5 leading-relaxed text-center">
                Upload a CSV with employee performance data or use sample data to explore the dashboard.
              </p>
              <div className="flex flex-col gap-2.5">
                <Button
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/80"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiUpload className="w-4 h-4 mr-2" />
                  Upload CSV File
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-secondary"
                  onClick={() => setSampleMode(true)}
                >
                  <FiBarChart2 className="w-4 h-4 mr-2" />
                  Use Sample Data
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ======== DASHBOARD CANVAS ======== */}
        {hasData && !isParsingFile && (
          <div className="p-3 space-y-3">

            {/* ===== ROW 1: KPI GAUGE RINGS ===== */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Card className="bg-card border border-border/50 shadow-md shadow-black/5 flex items-center justify-center py-4">
                <GaugeRing value={stats.avgProd} max={100} color="hsl(27, 61%, 35%)" label="Avg Productivity" />
              </Card>
              <Card className="bg-card border border-border/50 shadow-md shadow-black/5 flex items-center justify-center py-4">
                <GaugeRing value={stats.avgQual} max={100} color="hsl(36, 60%, 31%)" label="Avg Quality" />
              </Card>
              <Card className="bg-card border border-border/50 shadow-md shadow-black/5 flex items-center justify-center py-4">
                <GaugeRing value={stats.avgAtt} max={100} color="hsl(30, 50%, 40%)" label="Avg Attendance" />
              </Card>
              <Card className="bg-card border border-border/50 shadow-md shadow-black/5 flex items-center justify-center py-4">
                <GaugeRing value={stats.avgFinal} max={100} color="hsl(15, 55%, 38%)" label="Avg Final Score" />
              </Card>
              <Card className="bg-card border border-border/50 shadow-md shadow-black/5 flex items-center justify-center py-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-[110px] h-[110px] relative flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center" style={{ borderColor: 'hsl(20, 45%, 45%)' }}>
                      <span className="text-2xl font-bold text-foreground font-serif">{stats.teamSize}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground tracking-wider uppercase text-center leading-tight">Team Members</span>
                </div>
              </Card>
            </div>

            {/* ===== ROW 2: GROUPED BAR + DONUT ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
              {/* Grouped Bar: All KPIs by Employee */}
              <Card className="lg:col-span-3 bg-card border border-border/50 shadow-md shadow-black/5">
                <TileHeader title="KPI Comparison by Employee" icon={<FiBarChart2 className="w-3 h-3" />} />
                <CardContent className="pt-0 pb-3 px-3">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={groupedBarData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(20, 18%, 16%)" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 10 }} stroke="hsl(20, 18%, 16%)" angle={-35} textAnchor="end" interval={0} />
                      <YAxis tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 10 }} stroke="hsl(20, 18%, 16%)" domain={[0, 100]} />
                      <RechartsTooltip content={<CustomBarTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 10, color: 'hsl(35, 15%, 55%)' }} />
                      <Bar dataKey="productivity" name="Productivity" fill="hsl(27, 61%, 35%)" radius={[2, 2, 0, 0]} barSize={10} />
                      <Bar dataKey="quality" name="Quality" fill="hsl(36, 60%, 31%)" radius={[2, 2, 0, 0]} barSize={10} />
                      <Bar dataKey="attendance" name="Attendance" fill="hsl(30, 50%, 40%)" radius={[2, 2, 0, 0]} barSize={10} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Donut: Performance Distribution */}
              <Card className="lg:col-span-2 bg-card border border-border/50 shadow-md shadow-black/5">
                <TileHeader title="Performance Distribution" icon={<FiPercent className="w-3 h-3" />} />
                <CardContent className="pt-0 pb-3 px-3">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={performanceTiers.filter(t => t.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius="50%"
                        outerRadius="75%"
                        paddingAngle={3}
                        dataKey="value"
                        label={renderCustomPieLabel}
                        stroke="none"
                      >
                        {performanceTiers.filter(t => t.value > 0).map((tier, idx) => (
                          <Cell key={`tier-${idx}`} fill={tier.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomBarTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend below donut */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
                    {performanceTiers.map((t, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: t.color }} />
                        <span className="text-[10px] text-muted-foreground">{t.name}: {t.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ===== ROW 3: LEADERBOARD TABLE + SCATTER ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
              {/* Enhanced Leaderboard */}
              <Card className="lg:col-span-3 bg-card border border-border/50 shadow-md shadow-black/5">
                <TileHeader title="Employee Leaderboard" icon={<FiAward className="w-3 h-3" />} />
                <CardContent className="pt-0 pb-3 px-2">
                  <div className="flex items-center justify-between px-2 mb-1.5">
                    <span className="text-[10px] text-muted-foreground">{sortedEmployees.length} employees</span>
                    <span className="text-[10px] text-muted-foreground">Click row to drill down</span>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground text-[10px] tracking-wider uppercase w-[40px] py-2">#</TableHead>
                          <TableHead className="text-muted-foreground text-[10px] tracking-wider uppercase cursor-pointer py-2" onClick={() => handleSort('name')}>
                            <span className="flex items-center gap-1">Name <SortIcon field="name" /></span>
                          </TableHead>
                          <TableHead className="text-muted-foreground text-[10px] tracking-wider uppercase text-right cursor-pointer py-2" onClick={() => handleSort('productivity')}>
                            <span className="flex items-center justify-end gap-1">Prod <SortIcon field="productivity" /></span>
                          </TableHead>
                          <TableHead className="text-muted-foreground text-[10px] tracking-wider uppercase text-right cursor-pointer py-2" onClick={() => handleSort('quality')}>
                            <span className="flex items-center justify-end gap-1">Qual <SortIcon field="quality" /></span>
                          </TableHead>
                          <TableHead className="text-muted-foreground text-[10px] tracking-wider uppercase text-right cursor-pointer py-2" onClick={() => handleSort('attendance')}>
                            <span className="flex items-center justify-end gap-1">Att <SortIcon field="attendance" /></span>
                          </TableHead>
                          <TableHead className="text-muted-foreground text-[10px] tracking-wider uppercase text-right cursor-pointer py-2" onClick={() => handleSort('late')}>
                            <span className="flex items-center justify-end gap-1">Late <SortIcon field="late" /></span>
                          </TableHead>
                          <TableHead className="text-muted-foreground text-[10px] tracking-wider uppercase text-right cursor-pointer py-2" onClick={() => handleSort('finalPoints')}>
                            <span className="flex items-center justify-end gap-1">Final <SortIcon field="finalPoints" /></span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedEmployees.map((emp, idx) => {
                          const rank = idx + 1
                          return (
                            <TableRow
                              key={`${emp.empId}-${emp.month}-${idx}`}
                              className={cn(
                                'border-border cursor-pointer transition-colors duration-150',
                                idx % 2 === 0 ? 'bg-secondary/5' : '',
                                'hover:bg-secondary/30'
                              )}
                              onClick={() => setSelectedEmployee(emp.name)}
                            >
                              <TableCell className="py-2.5">
                                <RankBadge rank={rank} />
                              </TableCell>
                              <TableCell className="py-2.5">
                                <div>
                                  <p className="text-xs font-medium text-foreground">{emp.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{emp.empId}</p>
                                </div>
                              </TableCell>
                              {/* Productivity with inline bar */}
                              <TableCell className="text-xs text-right py-2.5 relative">
                                <div className="absolute inset-y-1 right-1 flex items-center" style={{ width: `${Math.min((emp.productivity / 100) * 75, 75)}%` }}>
                                  <div className="h-5 w-full rounded-sm opacity-15" style={{ backgroundColor: kpiColor(emp.productivity) }} />
                                </div>
                                <span className={cn('relative z-10 font-medium', kpiColorClass(emp.productivity))}>{emp.productivity}</span>
                              </TableCell>
                              {/* Quality with inline bar */}
                              <TableCell className="text-xs text-right py-2.5 relative">
                                <div className="absolute inset-y-1 right-1 flex items-center" style={{ width: `${Math.min((emp.quality / 100) * 75, 75)}%` }}>
                                  <div className="h-5 w-full rounded-sm opacity-15" style={{ backgroundColor: kpiColor(emp.quality) }} />
                                </div>
                                <span className={cn('relative z-10 font-medium', kpiColorClass(emp.quality))}>{emp.quality}</span>
                              </TableCell>
                              {/* Attendance with inline bar */}
                              <TableCell className="text-xs text-right py-2.5 relative">
                                <div className="absolute inset-y-1 right-1 flex items-center" style={{ width: `${Math.min((emp.attendance / 100) * 75, 75)}%` }}>
                                  <div className="h-5 w-full rounded-sm opacity-15" style={{ backgroundColor: kpiColor(emp.attendance) }} />
                                </div>
                                <span className={cn('relative z-10 font-medium', kpiColorClass(emp.attendance))}>{emp.attendance}</span>
                              </TableCell>
                              {/* Late */}
                              <TableCell className="text-xs text-right py-2.5">
                                <span className={cn('font-medium', emp.late > 3 ? 'text-red-400' : emp.late > 1 ? 'text-amber-400' : 'text-green-400')}>
                                  {emp.late}
                                </span>
                              </TableCell>
                              {/* Final Points */}
                              <TableCell className="text-xs text-right font-bold py-2.5" style={{ color: rank <= 3 ? (RANK_COLORS[rank] || 'hsl(35, 20%, 90%)') : 'hsl(35, 20%, 90%)' }}>
                                {emp.finalPoints}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Scatter Plot: Productivity vs Quality */}
              <Card className="lg:col-span-2 bg-card border border-border/50 shadow-md shadow-black/5">
                <TileHeader title="Productivity vs Quality" icon={<FiTarget className="w-3 h-3" />} />
                <CardContent className="pt-0 pb-3 px-3">
                  <ResponsiveContainer width="100%" height={340}>
                    <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(20, 18%, 16%)" />
                      <XAxis type="number" dataKey="productivity" name="Productivity" domain={[60, 100]} tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 10 }} stroke="hsl(20, 18%, 16%)" label={{ value: 'Productivity', position: 'insideBottom', offset: -5, fill: 'hsl(35, 15%, 45%)', fontSize: 10 }} />
                      <YAxis type="number" dataKey="quality" name="Quality" domain={[60, 100]} tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 10 }} stroke="hsl(20, 18%, 16%)" label={{ value: 'Quality', angle: -90, position: 'insideLeft', offset: 10, fill: 'hsl(35, 15%, 45%)', fontSize: 10 }} />
                      <RechartsTooltip content={<CustomScatterTooltip />} />
                      <Scatter data={scatterData} fill="hsl(36, 60%, 31%)">
                        {scatterData.map((entry, idx) => (
                          <Cell
                            key={`scatter-${idx}`}
                            fill={entry.finalPoints >= 90 ? 'hsl(142, 40%, 35%)' : entry.finalPoints >= 80 ? 'hsl(36, 60%, 31%)' : 'hsl(0, 63%, 31%)'}
                            r={Math.max(4, Math.min(entry.finalPoints / 12, 8))}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                  {/* Scatter legend */}
                  <div className="flex gap-3 justify-center mt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(142, 40%, 35%)' }} />
                      <span className="text-[10px] text-muted-foreground">90+</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(36, 60%, 31%)' }} />
                      <span className="text-[10px] text-muted-foreground">80-89</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(0, 63%, 31%)' }} />
                      <span className="text-[10px] text-muted-foreground">&lt;80</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ===== ROW 4: AREA CHART + HORIZONTAL BAR (Late Arrivals) ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Area Chart: Team Trend or Top 10 */}
              <Card className="bg-card border border-border/50 shadow-md shadow-black/5">
                <TileHeader
                  title={monthlyTrendData.length > 1 ? 'Team Average Trend' : 'Top 10 by Final Points'}
                  icon={monthlyTrendData.length > 1 ? <FiTrendingUp className="w-3 h-3" /> : <FiStar className="w-3 h-3" />}
                />
                <CardContent className="pt-0 pb-3 px-3">
                  {monthlyTrendData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                        <defs>
                          <linearGradient id="gradProd" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(27, 61%, 35%)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="hsl(27, 61%, 35%)" stopOpacity={0.05} />
                          </linearGradient>
                          <linearGradient id="gradQual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(36, 60%, 31%)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="hsl(36, 60%, 31%)" stopOpacity={0.05} />
                          </linearGradient>
                          <linearGradient id="gradAtt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(30, 50%, 40%)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="hsl(30, 50%, 40%)" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(20, 18%, 16%)" />
                        <XAxis dataKey="month" tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 10 }} stroke="hsl(20, 18%, 16%)" />
                        <YAxis tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 10 }} stroke="hsl(20, 18%, 16%)" domain={[60, 100]} />
                        <RechartsTooltip content={<CustomBarTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 10, color: 'hsl(35, 15%, 55%)' }} />
                        <Area type="monotone" dataKey="productivity" name="Productivity" stroke="hsl(27, 61%, 35%)" fill="url(#gradProd)" strokeWidth={2} />
                        <Area type="monotone" dataKey="quality" name="Quality" stroke="hsl(36, 60%, 31%)" fill="url(#gradQual)" strokeWidth={2} />
                        <Area type="monotone" dataKey="attendance" name="Attendance" stroke="hsl(30, 50%, 40%)" fill="url(#gradAtt)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={top10ChartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(20, 18%, 16%)" />
                        <XAxis dataKey="name" tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 10 }} stroke="hsl(20, 18%, 16%)" angle={-35} textAnchor="end" interval={0} />
                        <YAxis tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 10 }} stroke="hsl(20, 18%, 16%)" />
                        <RechartsTooltip content={<CustomBarTooltip />} />
                        <Bar dataKey="finalPoints" name="Final Points" radius={[3, 3, 0, 0]}>
                          {top10ChartData.map((_, idx) => (
                            <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Horizontal Bar: Late Arrivals */}
              <Card className="bg-card border border-border/50 shadow-md shadow-black/5">
                <TileHeader title="Late Arrivals by Employee" icon={<FiClock className="w-3 h-3" />} />
                <CardContent className="pt-0 pb-3 px-3">
                  {lateArrivalsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={lateArrivalsData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(20, 18%, 16%)" horizontal={false} />
                        <XAxis type="number" tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 10 }} stroke="hsl(20, 18%, 16%)" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 10 }} stroke="hsl(20, 18%, 16%)" width={55} />
                        <RechartsTooltip content={<CustomBarTooltip />} />
                        <Bar dataKey="late" name="Late Days" radius={[0, 3, 3, 0]} barSize={16}>
                          {lateArrivalsData.map((entry, idx) => (
                            <Cell
                              key={`late-${idx}`}
                              fill={entry.late >= 5 ? 'hsl(0, 63%, 31%)' : entry.late >= 3 ? 'hsl(27, 61%, 35%)' : 'hsl(36, 60%, 31%)'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground text-xs">
                      No late arrivals recorded
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ===== AGENT STATUS (compact) ===== */}
            <Card className="bg-card border border-border/50 shadow-md shadow-black/5">
              <CardContent className="px-4 py-2.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', activeAgentId ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/40')} />
                    <span className="text-[10px] text-muted-foreground tracking-wider uppercase">Performance Insight Agent</span>
                  </div>
                  <Separator orientation="vertical" className="h-3.5 hidden sm:block" />
                  <span className="text-[10px] text-muted-foreground font-mono">{AGENT_ID}</span>
                  <Badge variant="outline" className="border-border text-muted-foreground text-[10px] ml-auto py-0 h-5">
                    {activeAgentId ? 'Processing' : 'Ready'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ======== AI INSIGHTS SHEET ======== */}
        <Sheet open={insightsOpen} onOpenChange={setInsightsOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg lg:max-w-xl bg-card border-border p-0 flex flex-col">
            <SheetHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
              <SheetTitle className="text-sm font-serif text-foreground flex items-center gap-2">
                <HiOutlineSparkles className="w-4 h-4" style={{ color: 'hsl(36, 60%, 31%)' }} />
                AI Performance Insights
              </SheetTitle>
              <SheetDescription className="text-[10px] text-muted-foreground">
                Powered by Performance Insight Agent
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="px-5 py-4 space-y-3">
                {/* Insights loading */}
                {insightsLoading && (
                  <div className="space-y-3">
                    <Skeleton className="h-20 rounded-lg bg-muted" />
                    <Skeleton className="h-16 rounded-lg bg-muted" />
                    <Skeleton className="h-16 rounded-lg bg-muted" />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FiActivity className="w-3.5 h-3.5 animate-spin" />
                      Analyzing team performance data...
                    </div>
                  </div>
                )}

                {/* Insights error */}
                {insightsError && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-xs text-destructive flex items-start gap-2">
                    <FiAlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Failed to generate insights</p>
                      <p className="text-[10px] mt-1 opacity-80">{insightsError}</p>
                    </div>
                  </div>
                )}

                {/* Insights cards */}
                {insights && !insightsLoading && (
                  <div className="space-y-3">
                    {/* Summary */}
                    {insights.summary && (
                      <InsightCard icon={<FiInfo className="w-4 h-4" />} title="Summary" color="hsl(36, 60%, 31%)">
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          {renderMarkdown(insights.summary)}
                        </div>
                      </InsightCard>
                    )}

                    {/* Top Performers with mini bar */}
                    {Array.isArray(insights.top_performers) && insights.top_performers.length > 0 && (
                      <InsightCard icon={<FiAward className="w-4 h-4" />} title="Top Performers" color="#C5A054">
                        <div className="space-y-2">
                          {insights.top_performers.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-md bg-secondary/30">
                              <RankBadge rank={p?.rank ?? i + 1} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground">{p?.name ?? 'Unknown'}</p>
                                <p className="text-[10px] text-muted-foreground">{p?.highlight ?? ''}</p>
                                {/* Mini score bar */}
                                {(p?.final_points ?? 0) > 0 && (
                                  <div className="mt-1 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${Math.min((p?.final_points ?? 0), 100)}%`, backgroundColor: '#C5A054' }} />
                                  </div>
                                )}
                              </div>
                              {(p?.final_points ?? 0) > 0 && (
                                <Badge variant="outline" className="border-border text-foreground text-[10px] shrink-0 py-0 h-5">
                                  {p?.final_points}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </InsightCard>
                    )}

                    {/* Bottom Performers */}
                    {Array.isArray(insights.bottom_performers) && insights.bottom_performers.length > 0 && (
                      <InsightCard icon={<FiTrendingDown className="w-4 h-4" />} title="Needs Improvement" color="hsl(0, 63%, 31%)">
                        <div className="space-y-2">
                          {insights.bottom_performers.map((p, i) => (
                            <div key={i} className="flex items-start gap-3 p-2 rounded-md bg-secondary/30">
                              <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center text-[10px] font-medium text-destructive shrink-0">
                                {p?.rank ?? '?'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground">{p?.name ?? 'Unknown'}</p>
                                <p className="text-[10px] text-muted-foreground">{p?.concern ?? ''}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </InsightCard>
                    )}

                    {/* Attendance Flags */}
                    {Array.isArray(insights.attendance_flags) && insights.attendance_flags.length > 0 && (
                      <InsightCard icon={<FiAlertTriangle className="w-4 h-4" />} title="Attendance Flags" color="hsl(27, 61%, 35%)">
                        <div className="space-y-2">
                          {insights.attendance_flags.map((f, i) => (
                            <div key={i} className="flex items-start gap-3 p-2 rounded-md bg-secondary/30">
                              <FiAlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'hsl(27, 61%, 35%)' }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground">{f?.name ?? 'Unknown'}</p>
                                <p className="text-[10px] text-muted-foreground">{f?.issue ?? ''}</p>
                              </div>
                              {(f?.attendance_score ?? 0) > 0 && (
                                <Badge variant="outline" className="border-border text-muted-foreground text-[10px] shrink-0 py-0 h-5">
                                  {f?.attendance_score}%
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </InsightCard>
                    )}

                    {/* Trends */}
                    {Array.isArray(insights.trends) && insights.trends.length > 0 && (
                      <InsightCard icon={<FiTrendingUp className="w-4 h-4" />} title="Trends" color="hsl(30, 50%, 40%)">
                        <div className="space-y-2">
                          {insights.trends.map((t, i) => (
                            <div key={i} className="flex items-start gap-3 p-2 rounded-md bg-secondary/30">
                              {t?.direction === 'up' || t?.direction === 'improving' ? (
                                <FiTrendingUp className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-400" />
                              ) : t?.direction === 'down' || t?.direction === 'declining' ? (
                                <FiTrendingDown className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
                              ) : (
                                <FiActivity className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground">{t?.metric ?? 'Metric'}</p>
                                <p className="text-[10px] text-muted-foreground">{t?.detail ?? ''}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </InsightCard>
                    )}

                    {/* Recommendations */}
                    {Array.isArray(insights.recommendations) && insights.recommendations.length > 0 && (
                      <InsightCard icon={<FiCheckCircle className="w-4 h-4" />} title="Recommendations" color="hsl(36, 60%, 31%)">
                        <ul className="space-y-2">
                          {insights.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5" style={{ color: 'hsl(36, 60%, 31%)' }}>
                                {i + 1}
                              </span>
                              <span className="leading-relaxed">{rec ?? ''}</span>
                            </li>
                          ))}
                        </ul>
                      </InsightCard>
                    )}
                  </div>
                )}

                {/* Chat messages */}
                {chatMessages.length > 0 && insights && !insightsLoading && (
                  <Separator className="my-3 bg-border" />
                )}

                {chatMessages.slice(1).map((msg, idx) => (
                  <div key={idx} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs',
                      msg.role === 'user'
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-secondary/80 backdrop-blur-sm text-foreground border border-border/30'
                    )}>
                      {msg.role === 'assistant' ? (
                        <div className="leading-relaxed">{renderMarkdown(msg.content)}</div>
                      ) : (
                        <p>{msg.content}</p>
                      )}

                      {/* Inline agent response data */}
                      {msg.role === 'assistant' && msg.data && (
                        <div className="mt-2 space-y-2">
                          {Array.isArray(msg.data.top_performers) && msg.data.top_performers.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-foreground mb-1">Top Performers:</p>
                              {msg.data.top_performers.map((p, pi) => (
                                <p key={pi} className="text-[10px] text-muted-foreground">
                                  {p?.rank ?? pi + 1}. {p?.name ?? 'Unknown'} - {p?.highlight ?? ''}
                                </p>
                              ))}
                            </div>
                          )}
                          {Array.isArray(msg.data.recommendations) && msg.data.recommendations.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-foreground mb-1">Recommendations:</p>
                              {msg.data.recommendations.map((r, ri) => (
                                <p key={ri} className="text-[10px] text-muted-foreground">{ri + 1}. {r ?? ''}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Chat loading */}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary/80 backdrop-blur-sm border border-border/30 rounded-lg px-3.5 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
                      <FiActivity className="w-3 h-3 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            {/* Suggested questions */}
            {!insightsLoading && hasData && (
              <div className="px-5 py-2 border-t border-border shrink-0">
                <div className="flex gap-1.5 flex-wrap">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setChatInput(q)
                      }}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors border border-border/50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat input */}
            <div className="px-5 py-3 border-t border-border shrink-0">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about team performance..."
                  className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground text-xs h-9"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleChatSend()
                    }
                  }}
                  disabled={chatLoading}
                />
                <Button
                  onClick={handleChatSend}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-accent text-accent-foreground hover:bg-accent/80 shrink-0 h-9 w-9 p-0"
                >
                  {chatLoading ? (
                    <FiActivity className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FiSend className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </ErrorBoundary>
  )
}
