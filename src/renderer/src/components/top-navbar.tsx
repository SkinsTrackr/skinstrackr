import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Boxes, Settings } from 'lucide-react'
import { useNavigate } from 'react-router'
import { JSX } from 'react'

const navItems = [
  //   { name: 'Overview', path: '/overview', icon: LayoutDashboard },
  { name: 'Inventory', path: '/inventory', icon: Boxes },
  { name: 'Settings', path: '/setting', icon: Settings }
]

export default function TopNavbar(): JSX.Element {
  const [activeTab, setActiveTab] = useState(navItems[0])
  const navigate = useNavigate()

  useEffect(() => {
    navigate(activeTab.path)
  }, [activeTab, navigate])

  return (
    <div className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-8">
        <div className="flex items-center text-xl font-bold pr-18">
          <img src="/src/assets/logo-no-bg.png" alt="SkinsTrackr Logo" className="h-12 w-12" />
          <span className="text-white">SkinsTrackr</span>
        </div>

        <div className="flex space-x-4">
          {navItems.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              className={cn(
                'relative text-sm font-medium transition-all duration-300 ease-out hover:bg-accent/10',
                activeTab.name === item.name ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setActiveTab(item)}
            >
              <item.icon className="w-4 h-4 mr-0.4" />
              {item.name}
              {activeTab.name === item.name && (
                <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-500 rounded-full transition-all duration-300 ease-out" />
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
