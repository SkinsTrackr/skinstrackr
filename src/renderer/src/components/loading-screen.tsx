import { Spinner } from './ui/spinner'

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message }: LoadingScreenProps): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <Spinner className="size-6 text-yellow-500" />
        <p className="text-md text-muted-foreground">{message || 'Loading'}</p>
      </div>
    </div>
  )
}
