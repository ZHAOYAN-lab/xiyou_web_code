import { post } from '@/api/http/axios'

export function getRoute(data) {
  return post('/ifengniao/cloud/server/xiyou/navigation/route', data)
}
