'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Download, Upload, Palette, Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

export default function AssistantWorkspacePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Không gian làm việc</h1>
            <p className="text-muted-foreground">
              Blade of the Eternal - Chương 46 - Trang 1: Vẽ nền thành phố
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Tải tài nguyên
            </Button>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Nộp kết quả
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Tools Panel */}
          <Card className="bg-card lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Công cụ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Điều khiển</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="icon">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Layers</p>
                <div className="space-y-1">
                  {['Lineart gốc', 'Background', 'Shading', 'Effects'].map((layer, i) => (
                    <div 
                      key={layer}
                      className="flex items-center gap-2 rounded p-2 hover:bg-secondary/50 cursor-pointer"
                    >
                      <input type="checkbox" defaultChecked className="rounded" />
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{layer}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Tài nguyên</p>
                <div className="space-y-1 text-sm">
                  <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                    <Download className="h-3 w-3" />
                    reference_city.zip
                  </a>
                  <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                    <Download className="h-3 w-3" />
                    brushes_v2.abr
                  </a>
                  <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                    <Download className="h-3 w-3" />
                    style_guide.pdf
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Canvas */}
          <Card className="bg-card lg:col-span-3">
            <CardContent className="p-4">
              <div className="relative aspect-[3/4] rounded-lg bg-muted overflow-hidden">
                {/* Work canvas placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Palette className="mx-auto h-16 w-16 text-muted-foreground/30" />
                    <p className="mt-4 text-muted-foreground">Không gian làm việc</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Trang manga và vùng cần vẽ sẽ hiển thị ở đây
                    </p>
                  </div>
                </div>

                {/* Highlighted work region */}
                <div className="absolute top-[10%] left-[5%] w-[90%] h-[25%] border-2 border-dashed border-primary rounded">
                  <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Vùng cần vẽ
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Details */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Chi tiết công việc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mô tả</p>
                  <p className="text-foreground mt-1">
                    Vẽ nền cảnh thành phố Tokyo vào ban đêm với nhiều đèn neon và xe cộ. 
                    Cần tạo cảm giác nhộn nhịp nhưng cũng có phần bí ẩn.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Yêu cầu kỹ thuật</p>
                  <ul className="list-disc list-inside text-foreground mt-1 space-y-1">
                    <li>Resolution: 600 DPI</li>
                    <li>Color mode: Grayscale</li>
                    <li>File format: PSD với layers riêng biệt</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ghi chú từ tác giả</p>
                  <p className="text-foreground mt-1">
                    Tham khảo folder reference đã gửi. Chú ý ánh sáng từ các biển hiệu neon 
                    phải tạo highlight trên mặt đường ướt.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Deadline</p>
                  <p className="text-foreground mt-1">25/05/2026 (còn 4 ngày)</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Thù lao</p>
                  <p className="text-lg font-bold text-foreground mt-1">¥15,000</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
