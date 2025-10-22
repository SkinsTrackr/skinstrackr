import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function showToast(msg: string, severity: 'success' | 'error' | 'info') {
  switch (severity) {
    case 'success':
      toast.success(msg)
      break
    case 'error':
      toast.error(msg)
      break
    case 'info':
      toast.info(msg)
      break
  }

  return (
    <Button
      variant="outline"
      onClick={() =>
        toast.success('Event has been created', {
          description: 'Sunday, December 03, 2023 at 9:00 AM',
          action: {
            label: 'Undo',
            onClick: () => console.log('Undo')
          }
        })
      }
    >
      Show Toast
    </Button>
  )
}
