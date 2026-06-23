import torch
from torch.utils.data import Dataset


class QuestionAnsweringDataset(Dataset):
    def __init__(self, encodings: dict[str, list], start_positions: list[int], end_positions: list[int]):
        self.encodings = encodings
        self.start_positions = start_positions
        self.end_positions = end_positions

    def __getitem__(self, index: int):
        item = {key: torch.tensor(value[index]) for key, value in self.encodings.items()}
        item["start_positions"] = torch.tensor(self.start_positions[index])
        item["end_positions"] = torch.tensor(self.end_positions[index])
        return item

    def __len__(self) -> int:
        return len(self.start_positions)
