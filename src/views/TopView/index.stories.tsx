import { Meta, StoryObj } from '@storybook/react'
import { TopView } from '.'

const meta: Meta<typeof TopView> = {
  component: TopView,
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
