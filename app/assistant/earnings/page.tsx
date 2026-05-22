'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppShell } from '@/components/app-shell'
import { mockTasks, getTaskTypeLabel, formatCurrency } from '@/lib/mock-data'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TrendingUp, DollarSign, CheckCircle2, Clock } from 'lucide-react'

export default function AssistantEarningsPage() {
  const myTasks = mockTasks.filter(t => t.assignedTo === 'u2')
  const approvedTasks = myTasks.filter(t => t.status === 'approved')
  const pendingPaymentTasks = myTasks.filter(t => t.status === 'submitted')

  const totalEarned = approvedTasks.reduce((sum, t) => sum + t.payment, 0)
  const pendingAmount = pendingPaymentTasks.reduce((sum, t) => sum + t.payment, 0)

  // Mock monthly data
  const monthlyData = [
    { month: 'Tháng 1', earned: 42000, tasks: 5 },
    { month: 'Tháng 2', earned: 38000, tasks: 4 },
    { month: 'Tháng 3', earned: 55000, tasks: 6 },
    { month: 'Tháng 4', earned: 48000, tasks: 5 },
    { month: 'Tháng 5', earned: totalEarned, tasks: approvedTasks.length },
  ]

  const stats = [
    {
      label: 'Tổng thu nhập tháng này',
      value: formatCurrency(totalEarned),
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Đang chờ thanh toán',
      value: formatCurrency(pendingAmount),
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Số trang đã duyệt',
      value: approvedTasks.length,
      icon: CheckCircle2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Trung bình/trang',
      value: approvedTasks.length > 0 
        ? formatCurrency(Math.round(totalEarned / approvedTasks.length))
        : '¥0',
      icon: TrendingUp,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Thu nhập</h1>
            <p className="text-muted-foreground">Theo dõi thu nhập và lịch sử thanh toán</p>
          </div>
          <Select defaultValue="2026-05">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026-05">Tháng 5/2026</SelectItem>
              <SelectItem value="2026-04">Tháng 4/2026</SelectItem>
              <SelectItem value="2026-03">Tháng 3/2026</SelectItem>
              <SelectItem value="2026-02">Tháng 2/2026</SelectItem>
              <SelectItem value="2026-01">Tháng 1/2026</SelectItem>
            </SelectContent>
          </Select>
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
          {/* Monthly Chart */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Biểu đồ thu nhập</CardTitle>
              <CardDescription>Thu nhập theo tháng trong năm 2026</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.map((data) => {
                  const maxEarned = Math.max(...monthlyData.map(d => d.earned))
                  const percentage = (data.earned / maxEarned) * 100

                  return (
                    <div key={data.month} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{data.month}</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(data.earned)}
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-secondary overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{data.tasks} công việc</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Lịch sử thanh toán</CardTitle>
              <CardDescription>Các khoản đã nhận trong tháng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {approvedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/30 p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{getTaskTypeLabel(task.type)}</p>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-success">{formatCurrency(task.payment)}</p>
                      <Badge variant="outline" className="text-xs">Đã nhận</Badge>
                    </div>
                  </div>
                ))}
                {pendingPaymentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/30 p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{getTaskTypeLabel(task.type)}</p>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-warning">{formatCurrency(task.payment)}</p>
                      <Badge variant="secondary" className="text-xs">Chờ duyệt</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Chi tiết công việc tháng 5/2026</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Loại công việc</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thù lao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="text-muted-foreground">{task.createdAt}</TableCell>
                    <TableCell className="font-medium">{getTaskTypeLabel(task.type)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{task.description}</TableCell>
                    <TableCell>
                      <Badge variant={
                        task.status === 'approved' ? 'default' :
                        task.status === 'submitted' ? 'secondary' : 'outline'
                      }>
                        {task.status === 'approved' ? 'Đã duyệt' :
                         task.status === 'submitted' ? 'Chờ duyệt' :
                         task.status === 'in_progress' ? 'Đang làm' : 'Chờ làm'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(task.payment)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
