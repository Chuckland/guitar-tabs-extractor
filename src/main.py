from utils import get_file_name_without_extension, create_directory
from extractor import extract_frames
from user_params import get_user_input


def run():
    (
        video_path,
        threshold,
        x,
        y,
        skip_start_frames,
        skip_end_frames
    ) = get_user_input()

    width = 1280 - x
    height = 720 - y

    output_path = '{dir}/{file_name}.html'.format(
        dir=create_directory('../out'),
        file_name=get_file_name_without_extension(video_path)
    )

    extract_frames(
        video_path=video_path,
        output_path=output_path,
        threshold=threshold,
        skip_start_frames=skip_start_frames,
        skip_end_frames=skip_end_frames,
        start_point=(x, y),
        width=width,
        height=height
    )


if __name__ == '__main__':
    run()
