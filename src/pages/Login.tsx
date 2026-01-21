import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Mail, Lock, Eye, EyeOff, Brain, Network, Shield } from 'lucide-react'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login:', { email, password, rememberMe })
    navigate('/')
  }

  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0A2737]">
        <div className="absolute inset-0 z-0">
          <img
            alt="Mạng lưới dữ liệu AI trừu tượng"
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDR5EyjEhRKKPI1-ar9uw9S8wajleMGc1WrMZRCfGpQfHN2vqFxl0C-vQgl0LG6nYdyII9xO2k0L9FQPNuwPWadpd4TOIWQjS18g-fFVMRPS1eozyyClVOhupcWRxD46arpFmwBESVA_ogEIH_e38vXSH3WEq15XOFz3uvRQwaZ-5ytWWI4E_Yy0bUVogdRyBjDln-N_Q6qvz1_q3cksu2OFH5jDyxrkzoxnO61drhs9Lu_zN3TNTcyrj7fp1-TlJWHchpsXZqR_c3f"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#02182B]/90 to-[#0E4E5A]/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#02182B] via-transparent to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white h-full">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-full bg-[#E2F046] flex items-center justify-center text-[#0E4E5A] font-bold text-xl">
                E
              </div>
              <span className="text-2xl font-bold tracking-tight">ETECHS</span>
            </div>
          </div>
          <div className="mb-12 max-w-lg">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Từ Dữ Liệu Đến Trí Tuệ – <br />
              <span className="text-[#E2F046]">Từ Kết Nối Đến Cách Mạng Số</span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              Tiên phong trong chuyển đổi số và trí tuệ nhân tạo, hợp nhất dữ liệu – quy trình – con người để kiến tạo hệ sinh thái số thông minh.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 rounded-full glass-effect flex items-center gap-2 text-sm font-medium">
                <Brain className="w-5 h-5 text-[#E2F046]" />
                AI Intelligence
              </div>
              <div className="px-4 py-2 rounded-full glass-effect flex items-center gap-2 text-sm font-medium">
                <Network className="w-5 h-5 text-[#E2F046]" />
                Data Network
              </div>
              <div className="px-4 py-2 rounded-full glass-effect flex items-center gap-2 text-sm font-medium">
                <Shield className="w-5 h-5 text-[#E2F046]" />
                Secure Access
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            © 2024 ETECHS. All Rights Reserved.
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative bg-[#F8FAFC] dark:bg-[#02182B]">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#0E4E5A 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#E2F046] flex items-center justify-center text-[#0E4E5A] font-bold text-xl">
                E
              </div>
              <span className="text-2xl font-bold tracking-tight text-[#0E4E5A] dark:text-white">
                ETECHS
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0A2737] p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Chào mừng trở lại</h2>
              <p className="text-gray-500 dark:text-gray-400">Vui lòng nhập chi tiết để đăng nhập</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium mb-2">
                  Địa chỉ email
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-gray-600"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium mb-2">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-gray-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 text-gray-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                  >
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                <div className="text-sm">
                  <a className="font-medium text-[#0E4E5A] dark:text-[#E2F046] hover:underline transition-all" href="#">
                    Quên mật khẩu?
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-bold text-[#0E4E5A] bg-[#E2F046] hover:bg-[#cedd30] shadow-sm transform hover:scale-[1.02] transition-all duration-200"
              >
                Đăng nhập vào nền tảng
              </Button>
            </form>

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
              <Button variant="outline" className="h-12 rounded-xl font-medium">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
                Google
              </Button>
              <Button variant="outline" className="h-12 rounded-xl font-medium">
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
        </div>
      </div>
    </div>
  )
}

export default Login
