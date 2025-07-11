import { Meta, StoryObj } from '@storybook/react'
import { RoomView } from '.'

const meta: Meta<typeof RoomView> = {
  component: RoomView,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
}
export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
} 