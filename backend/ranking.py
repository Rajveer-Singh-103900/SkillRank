import heapq

def get_top_candidates(candidate_scores, k=5):

    # We use negative scores because heapq implements a min-heap by default
    heap = []

    for name, score in candidate_scores.items():
        #Push (-score, name) to the heap
        heapq.heappush(heap, (-score, name))

    results =[]
    #Pop the 'k' best candidates from the heap

    for _ in range(min(k, len(heap))):
        neg_score, name = heapq.heappop(heap)
        results.append({"name": name, "score": -neg_score})

    return results

if __name__ == "__main__":

    #Test data
    test_data = {"Raj": 85.5, "Anita": 92.0, "Suresh": 78.0, "Priya": 88.5, "Vikram": 90.0}
    print("Top 3 Candidates:", get_top_candidates(test_data, k=3))