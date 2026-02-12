import type { TopicsRepository } from "./ports"
import type { TrendingTopic } from "../domain/types"

export async function getTrendingTopicsUseCase(
  repository: TopicsRepository,
  limit = 8,
  daysBack = 7,
): Promise<TrendingTopic[]> {
  return repository.getTrendingTopics(limit, daysBack)
}
