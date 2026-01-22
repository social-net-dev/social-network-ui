import { LoginForm } from '../components/LoginForm'
import { AuthLayout } from '../components/AuthLayout'
import { LoginLeftPanel } from '../components/LoginLeftPanel'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function LoginPage() {
  return (
    <AuthLayout
      leftPanel={<LoginLeftPanel />}
      rightPanel={
        <>
          <div className="bg-white dark:bg-[#0A2737] p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Chào mừng trở lại</h2>
              <p className="text-gray-500 dark:text-gray-400">Vui lòng nhập chi tiết để đăng nhập</p>
            </div>

            <LoginForm />

            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-[#0A2737] text-gray-500 dark:text-gray-400">
                  Hoặc tiếp tục với
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-12 rounded-xl font-medium" type="button">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
                Google
              </Button>
              <Button variant="outline" className="h-12 rounded-xl font-medium" type="button">
                <svg className="h-5 w-5 mr-2 text-[#0077b5]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                LinkedIn
              </Button>
            </div>

            <div className="mt-8 text-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">Chưa có tài khoản?</span>
              <a className="font-bold text-[#0E4E5A] dark:text-[#E2F046] hover:underline ml-1" href="#">
                Yêu cầu demo
              </a>
            </div>
          </div>
        </>
      }
    />
  )
}
