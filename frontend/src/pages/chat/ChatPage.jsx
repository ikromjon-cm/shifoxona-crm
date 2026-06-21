import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { chatAPI } from '@/services/api'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/context/AuthContext'
import { Send, Plus, MessageSquare, Users, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDateTime } from '@/lib/utils'

export default function ChatPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [activeRoom, setActiveRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', room_type: 'group' })
  const messagesEndRef = useRef(null)

  useEffect(() => { fetchRooms() }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchRooms = async () => {
    try { const res = await chatAPI.rooms.myRooms(); setRooms(res.data.results || res.data) }
    catch { toast.error(t('common.error')) }
    finally { setLoading(false) }
  }

  const fetchMessages = async (roomId) => {
    try { const res = await chatAPI.messages.list(roomId); setMessages(res.data.results || res.data) }
    catch { toast.error(t('common.error')) }
  }

  const selectRoom = async (room) => {
    setActiveRoom(room)
    setMessages([])
    fetchMessages(room.id)
    try { await chatAPI.messages.markRead(room.id) } catch {}
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || !activeRoom) return
    try {
      await chatAPI.messages.send(activeRoom.id, { text })
      setText('')
      fetchMessages(activeRoom.id)
    } catch { toast.error('Xatolik') }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await chatAPI.rooms.create(form)
      toast.success(t('chat.roomCreated'))
      setShowCreate(false); fetchRooms()
    } catch (err) { toast.error(err.response?.data?.error || t('common.error')) }
  }

  const roomTypeIcon = (type) => {
    if (type === 'personal') return <Users className="h-5 w-5" />
    if (type === 'delivery') return <ChevronRight className="h-5 w-5" />
    return <MessageSquare className="h-5 w-5" />
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-10rem)]">
      {/* Rooms sidebar */}
      <div className="w-80 flex-shrink-0">
        <Card className="h-full">
          <CardContent className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{t('chat.rooms')}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {loading ? (
                <div className="text-center text-sm text-gray-400 py-8">{t('common.loading')}</div>
              ) : rooms.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-8">{t('chat.noRooms')}</div>
              ) : rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => selectRoom(room)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                    activeRoom?.id === room.id
                      ? 'bg-medical-50 dark:bg-medical-900/20 text-medical-700 dark:text-medical-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-medical-400 to-brand-500 flex items-center justify-center text-white">
                    {roomTypeIcon(room.room_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{room.name}</p>
                    <p className="text-xs text-gray-400 truncate">{room.member_count || 0} {t('chat.members')}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat area */}
      <div className="flex-1">
        {activeRoom ? (
          <Card className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold">{activeRoom.name}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-12">{t('chat.noMessages')}</div>
              ) : messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.author_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-2xl ${
                    msg.author_id === user?.id
                      ? 'bg-gradient-to-r from-medical-500 to-brand-500 text-white'
                      : 'bg-gray-50 dark:bg-gray-700/50'
                  }`}>
                    {msg.author_id !== user?.id && (
                      <p className="text-xs opacity-70 mb-1">{msg.author_name}</p>
                    )}
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs mt-1 opacity-60 text-right">{formatDateTime(msg.created_at)}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('chat.placeholder')} className="flex-1" />
              <Button type="submit" disabled={!text.trim()}><Send className="h-4 w-4" /></Button>
            </form>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('chat.selectRoom')}</p>
            </div>
          </Card>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={t('chat.newRoom')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label={t('chat.roomName')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('chat.roomType')}</label>
            <select className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-sm mt-1" value={form.room_type} onChange={(e) => setForm({ ...form, room_type: e.target.value })}>
              <option value="group">{t('chat.typeGroup')}</option>
              <option value="personal">{t('chat.typePersonal')}</option>
              <option value="delivery">{t('chat.typeDelivery')}</option>
              <option value="order">{t('chat.typeOrder')}</option>
              <option value="warehouse">{t('chat.typeWarehouse')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('chat.create')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
