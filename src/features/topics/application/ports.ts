import type { TrendingTopic } from "../domain/types"

export interface TopicsRepository {
  getTrendingTopics(limit: number, daysBack: number): Promise<TrendingTopic[]>
}
