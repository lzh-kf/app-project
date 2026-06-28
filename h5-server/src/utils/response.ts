import { Response } from 'express'

export function success(res: Response, data: any = null, message: string = 'ok') {
  return res.json({ code: 0, message, data })
}

export function fail(res: Response, message: string = '操作失败', code: number = -1, status: number = 200) {
  return res.status(status).json({ code, message, data: null })
}

export function paginate(
  res: Response,
  list: any[],
  total: number,
  page: number,
  pageSize: number,
  message: string = 'ok'
) {
  return res.json({
    code: 0,
    message,
    data: { list, total, page, pageSize },
  })
}
