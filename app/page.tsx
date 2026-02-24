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
import { Progress } from '@/components/ui/progress'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, LineChart, Line, Legend, Cell
} from 'recharts'
import {
  FiUpload, FiSend, FiArrowLeft, FiTrendingUp, FiTrendingDown, FiUsers,
  FiAward, FiAlertTriangle, FiMessageSquare, FiBarChart2, FiChevronDown,
  FiChevronUp, FiTarget, FiClock, FiStar, FiZap, FiX, FiCheckCircle,
  FiInfo, FiActivity, FiPercent
} from 'react-icons/fi'

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
          {entry.name}: <span className="text-foreground font-medium">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

// ---- KPI CARD ----

function KpiCard({ icon, label, value, sub, accentColor }: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  accentColor?: string
}) {
  return (
    <Card className="bg-card border border-border shadow-lg shadow-black/10 overflow-hidden">
      <div className="flex items-stretch">
        <div className="w-1 shrink-0" style={{ backgroundColor: accentColor || 'hsl(36, 60%, 31%)' }} />
        <CardContent className="flex items-center gap-4 p-4 flex-1">
          <div className="p-2.5 rounded-lg bg-secondary/80 text-accent-foreground">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs tracking-wide uppercase text-muted-foreground font-sans">{label}</p>
            <p className="text-2xl font-serif font-bold text-foreground leading-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </CardContent>
      </div>
    </Card>
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
      if (sortField === 'rank') return 0 // rank is derived
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

    // Reset input so same file can be uploaded again
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
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Back button */}
            <Button
              variant="ghost"
              onClick={() => setSelectedEmployee(null)}
              className="mb-6 text-muted-foreground hover:text-foreground"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            {/* Employee header */}
            <Card className="bg-card border border-border shadow-lg shadow-black/10 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <RankBadge rank={selectedEmpData.rank} />
                    <div>
                      <h1 className="text-2xl font-serif font-bold text-foreground">{selectedEmpData.name}</h1>
                      <p className="text-sm text-muted-foreground">{selectedEmpData.empId} | Joined: {selectedEmpData.doj || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 sm:ml-auto">
                    <Badge variant="outline" className="border-border text-foreground bg-secondary/50">
                      Final Score: {selectedEmpData.finalPoints}
                    </Badge>
                    <Badge variant="outline" className="border-border text-foreground bg-secondary/50">
                      Rank #{selectedEmpData.rank}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Two column charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Radar chart */}
              <Card className="bg-card border border-border shadow-lg shadow-black/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-serif text-foreground flex items-center gap-2">
                    <FiTarget className="w-4 h-4" style={{ color: 'hsl(36, 60%, 31%)' }} />
                    KPI Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(20, 18%, 20%)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 10 }} />
                      <Radar name="Score" dataKey="value" stroke="hsl(36, 60%, 31%)" fill="hsl(36, 60%, 31%)" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Trend line chart */}
              <Card className="bg-card border border-border shadow-lg shadow-black/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-serif text-foreground flex items-center gap-2">
                    <FiTrendingUp className="w-4 h-4" style={{ color: 'hsl(27, 61%, 35%)' }} />
                    Performance Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {trendData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(20, 18%, 16%)" />
                        <XAxis dataKey="month" tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 12 }} stroke="hsl(20, 18%, 16%)" />
                        <YAxis tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 12 }} stroke="hsl(20, 18%, 16%)" />
                        <RechartsTooltip content={<CustomBarTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12, color: 'hsl(35, 15%, 55%)' }} />
                        <Line type="monotone" dataKey="finalPoints" name="Final Points" stroke="hsl(36, 60%, 31%)" strokeWidth={2} dot={{ fill: 'hsl(36, 60%, 31%)', r: 4 }} />
                        <Line type="monotone" dataKey="productivity" name="Productivity" stroke="hsl(27, 61%, 35%)" strokeWidth={2} dot={{ fill: 'hsl(27, 61%, 35%)', r: 4 }} />
                        <Line type="monotone" dataKey="quality" name="Quality" stroke="hsl(30, 50%, 40%)" strokeWidth={2} dot={{ fill: 'hsl(30, 50%, 40%)', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                      <p>Single month data available. Upload multi-month data to see trends.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Monthly breakdown table */}
            <Card className="bg-card border border-border shadow-lg shadow-black/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-serif text-foreground">Monthly Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground text-xs tracking-wide uppercase">Month</TableHead>
                        <TableHead className="text-muted-foreground text-xs tracking-wide uppercase text-right">Productivity</TableHead>
                        <TableHead className="text-muted-foreground text-xs tracking-wide uppercase text-right">Quality</TableHead>
                        <TableHead className="text-muted-foreground text-xs tracking-wide uppercase text-right">Attendance</TableHead>
                        <TableHead className="text-muted-foreground text-xs tracking-wide uppercase text-right">Late</TableHead>
                        <TableHead className="text-muted-foreground text-xs tracking-wide uppercase text-right">Total Pts</TableHead>
                        <TableHead className="text-muted-foreground text-xs tracking-wide uppercase text-right">Final Pts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEmpData.allRecords.map((r, idx) => (
                        <TableRow key={idx} className="border-border hover:bg-secondary/30">
                          <TableCell className="text-sm font-medium text-foreground">{r.month || 'N/A'}</TableCell>
                          <TableCell className="text-sm text-right text-foreground">{r.productivity}</TableCell>
                          <TableCell className="text-sm text-right text-foreground">{r.quality}</TableCell>
                          <TableCell className="text-sm text-right text-foreground">{r.attendance}</TableCell>
                          <TableCell className="text-sm text-right text-foreground">{r.late}</TableCell>
                          <TableCell className="text-sm text-right text-foreground">{r.totalPoints}</TableCell>
                          <TableCell className="text-sm text-right font-semibold text-foreground">{r.finalPoints}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  // ---- MAIN DASHBOARD VIEW ----
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <FiBarChart2 className="w-5 h-5" style={{ color: 'hsl(36, 60%, 31%)' }} />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold text-foreground tracking-wide">KPI Performance Dashboard</h1>
                <p className="text-xs text-muted-foreground">Team analytics and AI-powered insights</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Sample Data Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sample Data</span>
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

              <Separator orientation="vertical" className="h-6 hidden sm:block" />

              {/* Upload button */}
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <FiUpload className="w-4 h-4 mr-2" />
                Upload Data
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Generate Insights */}
              <Button
                onClick={handleGenerateInsights}
                disabled={!hasData || insightsLoading}
                className="bg-accent text-accent-foreground hover:bg-accent/80"
              >
                {insightsLoading ? (
                  <>
                    <FiActivity className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FiZap className="w-4 h-4 mr-2" />
                    Generate Insights
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* File error */}
        {fileError && (
          <div className="max-w-7xl mx-auto px-4 mt-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-2 text-sm text-destructive">
              <FiAlertTriangle className="w-4 h-4 shrink-0" />
              {fileError}
              <button onClick={() => setFileError('')} className="ml-auto">
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Parsing skeleton */}
        {isParsingFile && (
          <div className="max-w-7xl mx-auto px-4 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-24 rounded-lg bg-muted" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-lg bg-muted" />
          </div>
        )}

        {/* Empty state */}
        {!hasData && !isParsingFile && (
          <div className="max-w-7xl mx-auto px-4 mt-20 flex flex-col items-center justify-center text-center">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-lg shadow-black/10 max-w-md w-full">
              <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <FiUpload className="w-7 h-7" style={{ color: 'hsl(36, 60%, 31%)' }} />
              </div>
              <h2 className="text-lg font-serif font-bold text-foreground mb-2">Upload your KPI data to get started</h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Upload a CSV file with employee performance data including productivity, quality, attendance, and more. Or toggle sample data to explore the dashboard.
              </p>
              <div className="flex flex-col gap-3">
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

        {/* Dashboard content */}
        {hasData && !isParsingFile && (
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard
                icon={<FiTrendingUp className="w-5 h-5" />}
                label="Avg Productivity"
                value={stats.avgProd.toFixed(1)}
                accentColor="hsl(27, 61%, 35%)"
              />
              <KpiCard
                icon={<FiCheckCircle className="w-5 h-5" />}
                label="Avg Quality"
                value={stats.avgQual.toFixed(1)}
                accentColor="hsl(36, 60%, 31%)"
              />
              <KpiCard
                icon={<FiPercent className="w-5 h-5" />}
                label="Avg Attendance"
                value={stats.avgAtt.toFixed(1) + '%'}
                accentColor="hsl(30, 50%, 40%)"
              />
              <KpiCard
                icon={<FiUsers className="w-5 h-5" />}
                label="Team Size"
                value={stats.teamSize}
                accentColor="hsl(20, 45%, 45%)"
              />
              <KpiCard
                icon={<FiAward className="w-5 h-5" />}
                label="Avg Final Score"
                value={stats.avgFinal.toFixed(1)}
                accentColor="hsl(15, 55%, 38%)"
              />
            </div>

            {/* Filter row */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground tracking-wide uppercase">Filter by Month</span>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[160px] bg-card border-border text-foreground text-sm">
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
              <div className="ml-auto text-xs text-muted-foreground">
                {sortedEmployees.length} employee{sortedEmployees.length !== 1 ? 's' : ''} showing
              </div>
            </div>

            {/* Leaderboard Table */}
            <Card className="bg-card border border-border shadow-lg shadow-black/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-serif text-foreground flex items-center gap-2">
                  <FiAward className="w-4 h-4" style={{ color: '#C5A054' }} />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground text-xs tracking-wide uppercase w-[60px]">Rank</TableHead>
                        <TableHead className="text-muted-foreground text-xs tracking-wide uppercase cursor-pointer" onClick={() => handleSort('name')}>
                          <span className="flex items-center gap-1">Name <SortIcon field="name" /></span>
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs tracking-wide uppercase text-right cursor-pointer" onClick={() => handleSort('productivity')}>
                          <span className="flex items-center justify-end gap-1">Productivity <SortIcon field="productivity" /></span>
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs tracking-wide uppercase text-right cursor-pointer" onClick={() => handleSort('quality')}>
                          <span className="flex items-center justify-end gap-1">Quality <SortIcon field="quality" /></span>
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs tracking-wide uppercase text-right cursor-pointer" onClick={() => handleSort('attendance')}>
                          <span className="flex items-center justify-end gap-1">Attendance <SortIcon field="attendance" /></span>
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs tracking-wide uppercase text-right cursor-pointer" onClick={() => handleSort('late')}>
                          <span className="flex items-center justify-end gap-1">Late <SortIcon field="late" /></span>
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs tracking-wide uppercase text-right cursor-pointer" onClick={() => handleSort('totalPoints')}>
                          <span className="flex items-center justify-end gap-1">Total Pts <SortIcon field="totalPoints" /></span>
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs tracking-wide uppercase text-right cursor-pointer" onClick={() => handleSort('finalPoints')}>
                          <span className="flex items-center justify-end gap-1">Final Pts <SortIcon field="finalPoints" /></span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedEmployees.map((emp, idx) => {
                        const rank = idx + 1
                        const isTop3 = rank <= 3
                        return (
                          <TableRow
                            key={`${emp.empId}-${emp.month}-${idx}`}
                            className={cn(
                              'border-border cursor-pointer transition-colors duration-200',
                              isTop3 ? 'hover:bg-accent/10' : 'hover:bg-secondary/30'
                            )}
                            onClick={() => setSelectedEmployee(emp.name)}
                          >
                            <TableCell className="py-3">
                              <RankBadge rank={rank} />
                            </TableCell>
                            <TableCell className="py-3">
                              <div>
                                <p className="text-sm font-medium text-foreground">{emp.name}</p>
                                <p className="text-xs text-muted-foreground">{emp.empId}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-right text-foreground py-3">{emp.productivity}</TableCell>
                            <TableCell className="text-sm text-right text-foreground py-3">{emp.quality}</TableCell>
                            <TableCell className="text-sm text-right text-foreground py-3">{emp.attendance}%</TableCell>
                            <TableCell className="text-sm text-right py-3">
                              <span className={cn(emp.late > 3 ? 'text-red-400' : 'text-foreground')}>
                                {emp.late}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-right text-foreground py-3">{emp.totalPoints}</TableCell>
                            <TableCell className="text-sm text-right font-bold py-3" style={{ color: isTop3 ? RANK_COLORS[rank] || 'hsl(35, 20%, 90%)' : 'hsl(35, 20%, 90%)' }}>
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

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 10 Bar Chart */}
              <Card className="bg-card border border-border shadow-lg shadow-black/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-serif text-foreground flex items-center gap-2">
                    <FiStar className="w-4 h-4" style={{ color: '#C5A054' }} />
                    Top 10 by Final Points
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={top10ChartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(20, 18%, 16%)" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 11 }} stroke="hsl(20, 18%, 16%)" angle={-35} textAnchor="end" interval={0} />
                      <YAxis tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 11 }} stroke="hsl(20, 18%, 16%)" />
                      <RechartsTooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="finalPoints" name="Final Points" radius={[4, 4, 0, 0]}>
                        {top10ChartData.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Attendance Distribution */}
              <Card className="bg-card border border-border shadow-lg shadow-black/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-serif text-foreground flex items-center gap-2">
                    <FiClock className="w-4 h-4" style={{ color: 'hsl(30, 50%, 40%)' }} />
                    Attendance Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={attendanceChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(20, 18%, 16%)" />
                      <XAxis dataKey="range" tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 11 }} stroke="hsl(20, 18%, 16%)" />
                      <YAxis tick={{ fill: 'hsl(35, 15%, 55%)', fontSize: 11 }} stroke="hsl(20, 18%, 16%)" allowDecimals={false} />
                      <RechartsTooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="count" name="Employees" fill="hsl(30, 50%, 40%)" radius={[4, 4, 0, 0]}>
                        {attendanceChartData.map((_, idx) => (
                          <Cell key={`att-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Agent Status Section */}
            <Card className="bg-card border border-border shadow-lg shadow-black/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2.5 h-2.5 rounded-full', activeAgentId ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/40')} />
                    <span className="text-xs text-muted-foreground tracking-wide uppercase">Performance Insight Agent</span>
                  </div>
                  <Separator orientation="vertical" className="h-4 hidden sm:block" />
                  <span className="text-xs text-muted-foreground font-mono">{AGENT_ID}</span>
                  <Badge variant="outline" className="border-border text-muted-foreground text-xs ml-auto">
                    {activeAgentId ? 'Processing' : 'Ready'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ---- AI INSIGHTS SHEET ---- */}
        <Sheet open={insightsOpen} onOpenChange={setInsightsOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg lg:max-w-xl bg-card border-border p-0 flex flex-col">
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
              <SheetTitle className="text-lg font-serif text-foreground flex items-center gap-2">
                <FiMessageSquare className="w-5 h-5" style={{ color: 'hsl(36, 60%, 31%)' }} />
                AI Performance Insights
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Powered by Performance Insight Agent
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="px-6 py-4 space-y-4">
                {/* Insights loading */}
                {insightsLoading && (
                  <div className="space-y-4">
                    <Skeleton className="h-20 rounded-lg bg-muted" />
                    <Skeleton className="h-16 rounded-lg bg-muted" />
                    <Skeleton className="h-16 rounded-lg bg-muted" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FiActivity className="w-4 h-4 animate-spin" />
                      Analyzing team performance data...
                    </div>
                  </div>
                )}

                {/* Insights error */}
                {insightsError && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive flex items-start gap-2">
                    <FiAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Failed to generate insights</p>
                      <p className="text-xs mt-1 opacity-80">{insightsError}</p>
                    </div>
                  </div>
                )}

                {/* Insights cards */}
                {insights && !insightsLoading && (
                  <div className="space-y-4">
                    {/* Summary */}
                    {insights.summary && (
                      <InsightCard icon={<FiInfo className="w-4 h-4" />} title="Summary" color="hsl(36, 60%, 31%)">
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          {renderMarkdown(insights.summary)}
                        </div>
                      </InsightCard>
                    )}

                    {/* Top Performers */}
                    {Array.isArray(insights.top_performers) && insights.top_performers.length > 0 && (
                      <InsightCard icon={<FiAward className="w-4 h-4" />} title="Top Performers" color="#C5A054">
                        <div className="space-y-2">
                          {insights.top_performers.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-md bg-secondary/30">
                              <RankBadge rank={p?.rank ?? i + 1} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{p?.name ?? 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{p?.highlight ?? ''}</p>
                              </div>
                              {(p?.final_points ?? 0) > 0 && (
                                <Badge variant="outline" className="border-border text-foreground text-xs shrink-0">
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
                              <div className="w-7 h-7 rounded-full bg-destructive/20 flex items-center justify-center text-xs font-medium text-destructive shrink-0">
                                {p?.rank ?? '?'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{p?.name ?? 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{p?.concern ?? ''}</p>
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
                              <FiAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'hsl(27, 61%, 35%)' }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{f?.name ?? 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{f?.issue ?? ''}</p>
                              </div>
                              {(f?.attendance_score ?? 0) > 0 && (
                                <Badge variant="outline" className="border-border text-muted-foreground text-xs shrink-0">
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
                                <FiTrendingUp className="w-4 h-4 shrink-0 mt-0.5 text-green-400" />
                              ) : t?.direction === 'down' || t?.direction === 'declining' ? (
                                <FiTrendingDown className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                              ) : (
                                <FiActivity className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{t?.metric ?? 'Metric'}</p>
                                <p className="text-xs text-muted-foreground">{t?.detail ?? ''}</p>
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
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ color: 'hsl(36, 60%, 31%)' }}>
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
                  <Separator className="my-4 bg-border" />
                )}

                {chatMessages.slice(1).map((msg, idx) => (
                  <div key={idx} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[85%] rounded-lg px-4 py-3 text-sm',
                      msg.role === 'user'
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-secondary text-foreground'
                    )}>
                      {msg.role === 'assistant' ? (
                        <div className="leading-relaxed">{renderMarkdown(msg.content)}</div>
                      ) : (
                        <p>{msg.content}</p>
                      )}

                      {/* Inline agent response data */}
                      {msg.role === 'assistant' && msg.data && (
                        <div className="mt-3 space-y-2">
                          {Array.isArray(msg.data.top_performers) && msg.data.top_performers.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-foreground mb-1">Top Performers:</p>
                              {msg.data.top_performers.map((p, pi) => (
                                <p key={pi} className="text-xs text-muted-foreground">
                                  {p?.rank ?? pi + 1}. {p?.name ?? 'Unknown'} - {p?.highlight ?? ''}
                                </p>
                              ))}
                            </div>
                          )}
                          {Array.isArray(msg.data.recommendations) && msg.data.recommendations.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-foreground mb-1">Recommendations:</p>
                              {msg.data.recommendations.map((r, ri) => (
                                <p key={ri} className="text-xs text-muted-foreground">{ri + 1}. {r ?? ''}</p>
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
                    <div className="bg-secondary rounded-lg px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
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
              <div className="px-6 py-2 border-t border-border shrink-0">
                <div className="flex gap-2 flex-wrap">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setChatInput(q)
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors border border-border"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat input */}
            <div className="px-6 py-4 border-t border-border shrink-0">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about team performance..."
                  className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
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
                  className="bg-accent text-accent-foreground hover:bg-accent/80 shrink-0"
                >
                  {chatLoading ? (
                    <FiActivity className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiSend className="w-4 h-4" />
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
