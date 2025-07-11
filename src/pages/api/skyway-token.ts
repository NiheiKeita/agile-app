import { NextApiRequest, NextApiResponse } from 'next'
import { SkyWayAuthToken } from '@skyway-sdk/token'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { channelName, memberName } = req.body

    if (!channelName || !memberName) {
      return res.status(400).json({ error: 'channelName and memberName are required' })
    }

    // SkyWayのシークレットキー（環境変数から取得）
    const secretKey = process.env.SKYWAY_SECRET_KEY
    if (!secretKey) {
      return res.status(500).json({ error: 'SkyWay secret key is not configured' })
    }

    // トークンの生成
    const token = new SkyWayAuthToken({
      jti: Math.random().toString(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24時間有効
      scope: {
        app: {
          id: process.env.SKYWAY_APP_ID || '',
          turn: true,
          actions: ['read'],
          channels: [
            {
              id: '*',
              name: '*',
              actions: ['write'],
              members: [
                {
                  id: '*',
                  name: '*',
                  actions: ['write'],
                  publication: {
                    actions: ['write'],
                  },
                  subscription: {
                    actions: ['write'],
                  },
                },
              ],
            },
          ],
        },
      },
    })

    const encodedToken = token.encode(secretKey)
    res.status(200).json({ token: encodedToken })
  } catch (error) {
    console.error('Token generation error:', error)
    res.status(500).json({ error: 'Failed to generate token' })
  }
} 