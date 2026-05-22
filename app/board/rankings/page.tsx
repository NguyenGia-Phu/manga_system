"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  Trophy,
  BarChart3,
  Calendar,
  Download,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { mockRankings, mockPollHistory } from "@/lib/mock-data"

export default function BoardRankingsPage() {
  const [rankings, setRankings] = useState(mockRankings)
  const [pollHistory] = useState(mockPollHistory)
  const [selectedWeek, setSelectedWeek] = useState("current")
  const [sortBy, setSortBy] = useState("rank")

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-success" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-destructive" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getTrendBadge = (change: number) => {
    if (change > 0) {
      return (
        <Badge variant="secondary" className="bg-success/10 text-success border-success/20 gap-1">
          <ArrowUp className="h-3 w-3" />
          +{change}
        </Badge>
      )
    }
    if (change < 0) {
      return (
        <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
          <ArrowDown className="h-3 w-3" />
          {change}
        </Badge>
      )
    }
    return <Badge variant="outline" className="gap-1"><Minus className="h-3 w-3" />0</Badge>
  }

  const sortedRankings = [...rankings].sort((a, b) => {
    switch (sortBy) {
      case "rank":
        return a.rank - b.rank
      case "votes":
        return b.votes - a.votes
      case "change":
        return b.change - a.change
      default:
        return a.rank - b.rank
    }
  })

  const atRiskSeries = rankings.filter(r => r.rank >= 15 || r.consecutiveBottom >= 3)
  const topPerformers = rankings.filter(r => r.rank <= 3)

  return (
    <AppShell role="board">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Series Rankings</h1>
            <p className="text-muted-foreground">Reader poll results and series performance</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Week 21 (Current)</SelectItem>
                <SelectItem value="week20">Week 20</SelectItem>
                <SelectItem value="week19">Week 19</SelectItem>
                <SelectItem value="week18">Week 18</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Series</p>
                  <p className="text-2xl font-bold">{rankings.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Votes</p>
                  <p className="text-2xl font-bold">{rankings.reduce((sum, r) => sum + r.votes, 0).toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Performers</p>
                  <p className="text-2xl font-bold">{topPerformers.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-chart-3/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-chart-3" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">At Risk</p>
                  <p className="text-2xl font-bold text-destructive">{atRiskSeries.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rankings" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="rankings" className="gap-2">
              <Trophy className="h-4 w-4" />
              Current Rankings
            </TabsTrigger>
            <TabsTrigger value="at-risk" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              At Risk Series
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Calendar className="h-4 w-4" />
              Poll History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rankings">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Weekly Rankings</CardTitle>
                  <CardDescription>Based on reader poll votes from Issue #21</CardDescription>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rank">By Rank</SelectItem>
                    <SelectItem value="votes">By Votes</SelectItem>
                    <SelectItem value="change">By Change</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Series</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead className="text-right">Votes</TableHead>
                      <TableHead className="text-center">Change</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRankings.map((series, index) => (
                      <TableRow key={series.id} className={series.rank <= 3 ? "bg-success/5" : series.rank >= 15 ? "bg-destructive/5" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {series.rank <= 3 ? (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                series.rank === 1 ? "bg-yellow-400 text-yellow-900" :
                                series.rank === 2 ? "bg-gray-300 text-gray-700" :
                                "bg-amber-600 text-amber-100"
                              }`}>
                                {series.rank}
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-medium text-sm">
                                {series.rank}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{series.title}</div>
                          <div className="text-xs text-muted-foreground">{series.genre}</div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{series.author}</TableCell>
                        <TableCell className="text-right font-medium">{series.votes.toLocaleString()}</TableCell>
                        <TableCell className="text-center">{getTrendBadge(series.change)}</TableCell>
                        <TableCell className="text-center">
                          {series.rank >= 15 ? (
                            <Badge variant="destructive">At Risk</Badge>
                          ) : series.rank <= 3 ? (
                            <Badge className="bg-success text-success-foreground">Top 3</Badge>
                          ) : series.consecutiveBottom >= 2 ? (
                            <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Watch</Badge>
                          ) : (
                            <Badge variant="outline">Stable</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="at-risk">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Series At Risk of Cancellation
                </CardTitle>
                <CardDescription>
                  Series ranked 15th or below, or with 3+ consecutive weeks in bottom rankings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {atRiskSeries.length > 0 ? (
                  <div className="space-y-4">
                    {atRiskSeries.map((series) => (
                      <div 
                        key={series.id} 
                        className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center font-bold text-destructive">
                            {series.rank}
                          </div>
                          <div>
                            <h4 className="font-medium">{series.title}</h4>
                            <p className="text-sm text-muted-foreground">{series.author}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {series.consecutiveBottom} weeks in bottom
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {series.votes.toLocaleString()} votes
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            View History
                          </Button>
                          <Button variant="destructive" size="sm">
                            Review for Decision
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 mx-auto text-success mb-4" />
                    <p className="text-muted-foreground">No series currently at risk</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Poll Data History</CardTitle>
                <CardDescription>Historical ranking data from previous issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pollHistory.map((poll) => (
                    <div 
                      key={poll.id} 
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{poll.issue}</h4>
                          <p className="text-sm text-muted-foreground">{poll.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{poll.totalVotes.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Total Votes</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{poll.seriesCount}</p>
                          <p className="text-xs text-muted-foreground">Series</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-success">{poll.topSeries}</p>
                          <p className="text-xs text-muted-foreground">#1 Series</p>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
