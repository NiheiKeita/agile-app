import { Meta, StoryObj } from '@storybook/react'
import { HomeView } from '.'

const meta: Meta<typeof HomeView> = {
  component: HomeView,
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