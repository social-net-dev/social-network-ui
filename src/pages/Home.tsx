import { Button } from '@/components/ui/button'

function Home() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Social Network UI</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Chào mừng đến với mạng xã hội của bạn
        </p>
        <Button>Khám phá</Button>
      </div>
    </div>
  )
}

export default Home
