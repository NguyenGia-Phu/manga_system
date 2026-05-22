'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AppShell } from '@/components/app-shell'
import { mockTasks, getTaskTypeLabel, getStatusLabel, formatCurrency } from '@/lib/mock-data'
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'

export default function AssistantDashboard() {
  const myTasks = mockTasks.filter(t => t.assignedTo === 'u2')
  const pendingTasks = myTasks.filter(t => t.status === 'pending' || t.status === 'in_progress')
  const submittedTasks = myTasks.filter(t => t.status === 'submitted')
  const approvedTasks = myTasks.filter(t => t.status === 'approved')
  
  const totalEarnings = approvedTasks.reduce((sum, t) => sum + t.payment, 0)
  const pendingEarnings = submittedTasks.reduce((sum, t) => sum + t.payment, 0)

  const stats = [
    {
      label: 'Công việc đang làm',
      value: pendingTasks.length,
      icon: ClipboardList,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Chờ duyệt',
      value: submittedTasks.length,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Đã hoàn thành',
      value: approvedTasks.length,
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Thu nhập tháng này',
      value: formatCurrency(totalEarnings),
      icon: DollarSign,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Xin chào, Sato Emi</h1>
          <p className="text-muted-foreground">Đây là tổng quan về công việc và thu nhập của bạn</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Urgent Tasks */}
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Công việc cần làm</CardTitle>
                <CardDescription>Các công việc đang chờ xử lý</CardDescription>
              </div>
              <Link href="/assistant/tasks">
                <Button variant="ghost" size="sm" className="gap-1">
                  Xem tất cả <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Không có công việc nào cần làm</p>
                </div>
              ) : (
                pendingTasks.map((task) => {
                  const deadline = new Date(task.deadline)
                  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  const isUrgent = daysLeft <= 2

                  return (
                    <div
                      key={task.id}
                      className={`rounded-lg border p-4 ${
                        isUrgent 
                          ? 'border-destructive/50 bg-destructive/5' 
                          : 'border-border bg-secondary/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">
                              {getTaskTypeLabel(task.type)}
                            </h3>
                            <Badge variant={task.status === 'in_progress' ? 'default' : 'secondary'}>
                              {getStatusLabel(task.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        </div>
                        {isUrgent && (
                          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className={isUrgent ? 'text-destructive' : 'text-muted-foreground'}>
                            Còn {daysLeft} ngày
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(task.payment)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Earnings Summary */}
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Thu nhập tháng 5/2026</CardTitle>
                <CardDescription>Tổng kết thu nhập trong tháng</CardDescription>
              </div>
              <Link href="/assistant/earnings">
                <Button variant="ghost" size="sm" className="gap-1">
                  Chi tiết <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Đã nhận</span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(totalEarnings)}</span>
                </div>
                <Progress value={70} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>70% mục tiêu tháng</span>
                  <span>Mục tiêu: {formatCurrency(50000)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm text-foreground">Đã duyệt</span>
                  </div>
                  <span className="font-medium text-foreground">{formatCurrency(totalEarnings)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    <span className="text-sm text-foreground">Chờ duyệt</span>
                  </div>
                  <span className="font-medium text-foreground">{formatCurrency(pendingEarnings)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">Đang làm</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {formatCurrency(pendingTasks.reduce((sum, t) => sum + t.payment, 0))}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-primary/10 p-4">
                <p className="text-sm text-foreground">
                  <span className="font-medium">Tổng tiềm năng:</span>{' '}
                  {formatCurrency(totalEarnings + pendingEarnings + pendingTasks.reduce((sum, t) => sum + t.payment, 0))}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
