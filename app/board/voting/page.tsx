"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  ThumbsUp, 
  ThumbsDown, 
  Calendar,
  User,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Sparkles
} from "lucide-react"
import { mockNewSeriesProposals, mockSeriesForDecision } from "@/lib/mock-data"

type VoteStatus = "pending" | "approved" | "rejected"

interface Proposal {
  id: string
  title: string
  author: string
  authorAvatar: string
  genre: string
  synopsis: string
  targetAudience: string
  submittedAt: string
  manuscriptUrl: string
  votesFor: number
  votesAgainst: number
  totalVoters: number
  myVote?: "for" | "against"
  status: VoteStatus
}

export default function BoardVotingPage() {
  const [proposals, setProposals] = useState<Proposal[]>(mockNewSeriesProposals)
  const [seriesDecisions, setSeriesDecisions] = useState(mockSeriesForDecision)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [voteReason, setVoteReason] = useState("")
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false)
  const [selectedSeries, setSelectedSeries] = useState<typeof mockSeriesForDecision[0] | null>(null)
  const [decision, setDecision] = useState<string>("")
  const [schedule, setSchedule] = useState<string>("")

  const handleVote = (proposalId: string, vote: "for" | "against") => {
    setProposals(proposals.map(p => {
      if (p.id === proposalId) {
        const wasFor = p.myVote === "for"
        const wasAgainst = p.myVote === "against"
        
        return {
          ...p,
          myVote: vote,
          votesFor: vote === "for" 
            ? p.votesFor + 1 - (wasFor ? 1 : 0) 
            : p.votesFor - (wasFor ? 1 : 0),
          votesAgainst: vote === "against" 
            ? p.votesAgainst + 1 - (wasAgainst ? 1 : 0) 
            : p.votesAgainst - (wasAgainst ? 1 : 0)
        }
      }
      return p
    }))
    setVoteReason("")
  }

  const handleDecision = () => {
    if (selectedSeries && decision) {
      setSeriesDecisions(seriesDecisions.map(s => {
        if (s.id === selectedSeries.id) {
          return { ...s, decision, schedule }
        }
        return s
      }))
      setDecisionDialogOpen(false)
      setSelectedSeries(null)
      setDecision("")
      setSchedule("")
    }
  }

  const pendingProposals = proposals.filter(p => p.status === "pending")
  const decidedProposals = proposals.filter(p => p.status !== "pending")

  return (
    <AppShell role="board">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Voting & Decisions</h1>
          <p className="text-muted-foreground">Vote on new series proposals and make publication decisions</p>
        </div>

        <Tabs defaultValue="new-series" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="new-series" className="gap-2">
              <Sparkles className="h-4 w-4" />
              New Series Proposals
            </TabsTrigger>
            <TabsTrigger value="decisions" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Publication Decisions
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              Vote History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-series" className="space-y-4">
            <div className="grid gap-4">
              {pendingProposals.map((proposal) => (
                <Card key={proposal.id} className="border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={proposal.authorAvatar} />
                          <AvatarFallback>{proposal.author[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{proposal.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {proposal.author}
                            <span className="text-muted-foreground/50">|</span>
                            <Calendar className="h-3 w-3" />
                            {proposal.submittedAt}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{proposal.genre}</Badge>
                        <Badge variant="outline">{proposal.targetAudience}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">{proposal.synopsis}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-success">
                          <ThumbsUp className="h-4 w-4" />
                          <span className="font-medium">{proposal.votesFor}</span>
                        </div>
                        <div className="flex items-center gap-1 text-destructive">
                          <ThumbsDown className="h-4 w-4" />
                          <span className="font-medium">{proposal.votesAgainst}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {proposal.votesFor + proposal.votesAgainst} / {proposal.totalVoters} voted
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedProposal(proposal)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{proposal.title}</DialogTitle>
                              <DialogDescription>
                                Submitted by {proposal.author} on {proposal.submittedAt}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex gap-2">
                                <Badge variant="secondary">{proposal.genre}</Badge>
                                <Badge variant="outline">{proposal.targetAudience}</Badge>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Synopsis</Label>
                                <p className="text-sm text-muted-foreground mt-1">{proposal.synopsis}</p>
                              </div>
                              <div className="bg-muted rounded-lg p-4 flex items-center justify-center h-48">
                                <div className="text-center text-muted-foreground">
                                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">Manuscript Preview</p>
                                  <Button variant="link" size="sm" className="mt-2">
                                    Open Full Manuscript
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant={proposal.myVote === "for" ? "default" : "outline"}
                          size="sm"
                          className={proposal.myVote === "for" ? "bg-success hover:bg-success/90 text-success-foreground" : ""}
                          onClick={() => handleVote(proposal.id, "for")}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant={proposal.myVote === "against" ? "default" : "outline"}
                          size="sm"
                          className={proposal.myVote === "against" ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}
                          onClick={() => handleVote(proposal.id, "against")}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {pendingProposals.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No pending proposals to vote on</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="decisions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Series Requiring Decisions</CardTitle>
                <CardDescription>Make publication schedule and continuation decisions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {seriesDecisions.map((series) => (
                    <div 
                      key={series.id} 
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium">{series.title}</h4>
                          <p className="text-sm text-muted-foreground">{series.author}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={series.rank <= 5 ? "default" : series.rank <= 10 ? "secondary" : "destructive"}
                              className={series.rank <= 5 ? "bg-success text-success-foreground" : ""}
                            >
                              Rank #{series.rank}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Current: {series.currentSchedule}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {series.decision ? (
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Decision Made
                          </Badge>
                        ) : (
                          <Dialog open={decisionDialogOpen && selectedSeries?.id === series.id} onOpenChange={(open) => {
                            setDecisionDialogOpen(open)
                            if (open) setSelectedSeries(series)
                          }}>
                            <DialogTrigger asChild>
                              <Button>Make Decision</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Decision for {series.title}</DialogTitle>
                                <DialogDescription>
                                  Current rank: #{series.rank} | Schedule: {series.currentSchedule}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Decision</Label>
                                  <RadioGroup value={decision} onValueChange={setDecision}>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="continue" id="continue" />
                                      <Label htmlFor="continue" className="font-normal">Continue publication</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="change-schedule" id="change-schedule" />
                                      <Label htmlFor="change-schedule" className="font-normal">Change publication schedule</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="hiatus" id="hiatus" />
                                      <Label htmlFor="hiatus" className="font-normal">Put on hiatus</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="cancel" id="cancel" />
                                      <Label htmlFor="cancel" className="font-normal text-destructive">Cancel series</Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                                
                                {decision === "change-schedule" && (
                                  <div className="space-y-2">
                                    <Label>New Schedule</Label>
                                    <Select value={schedule} onValueChange={setSchedule}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select schedule" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                                
                                <div className="space-y-2">
                                  <Label>Reason (Optional)</Label>
                                  <Textarea placeholder="Add notes about this decision..." />
                                </div>
                              </div>
                              
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDecisionDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleDecision} disabled={!decision}>
                                  Confirm Decision
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Voting History</CardTitle>
                <CardDescription>Your past votes and decisions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {decidedProposals.map((proposal) => (
                    <div 
                      key={proposal.id} 
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        {proposal.status === "approved" ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                        <div>
                          <p className="font-medium">{proposal.title}</p>
                          <p className="text-sm text-muted-foreground">
                            by {proposal.author} | {proposal.submittedAt}
                          </p>
                        </div>
                      </div>
                      <Badge variant={proposal.status === "approved" ? "default" : "destructive"}>
                        {proposal.status === "approved" ? "Approved" : "Rejected"}
                      </Badge>
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
