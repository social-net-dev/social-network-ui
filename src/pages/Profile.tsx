import { useParams } from 'react-router-dom'

function Profile() {
  const { userId } = useParams()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Trang cá nhân</h1>
        {userId && <p className="text-lg text-muted-foreground mb-8">User ID: {userId}</p>}
        {!userId && <p className="text-lg text-muted-foreground mb-8">Trang hồ sơ của bạn</p>}
      </div>
    </div>
  )
}

export default Profile
