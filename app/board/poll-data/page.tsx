"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Upload, 
  Plus,
  Trash2,
  Save,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Calendar,
  RefreshCw,
  X,
  FileUp
} from "lucide-react"
import { mockRankings } from "@/lib/mock-data"

interface PollEntry {
  seriesId: string
  seriesTitle: string
  votes: number
}

export default function BoardPollDataPage() {
  const [issueNumber, setIssueNumber] = useState("")
  const [pollDate, setPollDate] = useState("")
  const [entries, setEntries] = useState<PollEntry[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newEntry, setNewEntry] = useState({ seriesId: "", votes: "" })
  
  const availableSeries = mockRankings.map(r => ({ id: r.id, title: r.title }))

  const handleAddEntry = () => {
    if (newEntry.seriesId && newEntry.votes) {
      const series = availableSeries.find(s => s.id === newEntry.seriesId)
      if (series) {
        setEntries([...entries, {
          seriesId: newEntry.seriesId,
          seriesTitle: series.title,
          votes: parseInt(newEntry.votes)
        }])
        setNewEntry({ seriesId: "", votes: "" })
        setShowAddDialog(false)
      }
    }
  }

  const handleRemoveEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Simulate CSV parsing
      const sampleData: PollEntry[] = mockRankings.slice(0, 10).map(r => ({
        seriesId: r.id,
        seriesTitle: r.title,
        votes: Math.floor(Math.random() * 5000) + 1000
      }))
      setEntries(sampleData)
    }
  }

  const handleSubmit = async () => {
    if (!issueNumber || !pollDate || entries.length === 0) return
    
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setSubmitted(true)
  }

  const handleReset = () => {
    setIssueNumber("")
    setPollDate("")
    setEntries([])
    setSubmitted(false)
  }

  const totalVotes = entries.reduce((sum, e) => sum + e.votes, 0)
  const sortedEntries = [...entries].sort((a, b) => b.votes - a.votes)

  if (submitted) {
    return (
      <AppShell>
        <div className="p-6">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-12 pb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Poll Data Submitted</h2>
              <p className="text-muted-foreground mb-6">
                Issue #{issueNumber} poll data has been successfully recorded.
                Rankings have been updated.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={handleReset}>
                  <Plus className="h-4 w-4 mr-2" />
                  Enter New Data
                </Button>
                <Button asChild>
                  <a href="/board/rankings">View Updated Rankings</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Poll Data Entry</h1>
          <p className="text-muted-foreground">Enter reader poll results to update series rankings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Issue Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Issue Information
                </CardTitle>
                <CardDescription>Enter the issue number and publication date</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issue">Issue Number</Label>
                    <Input 
                      id="issue" 
                      placeholder="e.g., 22"
                      value={issueNumber}
                      onChange={(e) => setIssueNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Poll Date</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={pollDate}
                      onChange={(e) => setPollDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Entry */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Vote Data
                    </CardTitle>
                    <CardDescription>Add vote counts for each series</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="csv-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-3 py-2 text-sm border border-input rounded-md hover:bg-accent transition-colors">
                        <FileUp className="h-4 w-4" />
                        Import CSV
                      </div>
                      <input 
                        id="csv-upload" 
                        type="file" 
                        accept=".csv" 
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </Label>
                    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Entry
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Vote Entry</DialogTitle>
                          <DialogDescription>Select a series and enter the vote count</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Series</Label>
                            <Select value={newEntry.seriesId} onValueChange={(v) => setNewEntry({ ...newEntry, seriesId: v })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select series" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableSeries
                                  .filter(s => !entries.find(e => e.seriesId === s.id))
                                  .map(series => (
                                    <SelectItem key={series.id} value={series.id}>
                                      {series.title}
                                    </SelectItem>
                                  ))
                                }
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Vote Count</Label>
                            <Input 
                              type="number" 
                              placeholder="Enter vote count"
                              value={newEntry.votes}
                              onChange={(e) => setNewEntry({ ...newEntry, votes: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                          <Button onClick={handleAddEntry} disabled={!newEntry.seriesId || !newEntry.votes}>
                            Add Entry
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {entries.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Series</TableHead>
                        <TableHead className="text-right">Votes</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedEntries.map((entry, index) => (
                        <TableRow key={entry.seriesId}>
                          <TableCell>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              index === 0 ? "bg-yellow-400 text-yellow-900" :
                              index === 1 ? "bg-gray-300 text-gray-700" :
                              index === 2 ? "bg-amber-600 text-amber-100" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {index + 1}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{entry.seriesTitle}</TableCell>
                          <TableCell className="text-right">{entry.votes.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveEntry(entries.indexOf(entry))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 border border-dashed border-border rounded-lg">
                    <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-2">No entries yet</p>
                    <p className="text-sm text-muted-foreground">
                      Add entries manually or import from CSV
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issue</span>
                  <span className="font-medium">{issueNumber ? `#${issueNumber}` : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{pollDate || "-"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Series Count</span>
                  <span className="font-medium">{entries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Votes</span>
                  <span className="font-medium">{totalVotes.toLocaleString()}</span>
                </div>
                {entries.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Top 3</span>
                      {sortedEntries.slice(0, 3).map((entry, i) => (
                        <div key={entry.seriesId} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Badge variant="secondary" className="w-5 h-5 p-0 flex items-center justify-center text-xs">
                              {i + 1}
                            </Badge>
                            <span className="truncate max-w-[120px]">{entry.seriesTitle}</span>
                          </span>
                          <span className="text-muted-foreground">{entry.votes.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {entries.length > 0 && (!issueNumber || !pollDate) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please fill in issue number and date before submitting.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2">
              <Button 
                className="w-full" 
                size="lg"
                disabled={!issueNumber || !pollDate || entries.length === 0 || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Submit Poll Data
                  </>
                )}
              </Button>
              {entries.length > 0 && (
                <Button variant="outline" className="w-full" onClick={handleReset}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
